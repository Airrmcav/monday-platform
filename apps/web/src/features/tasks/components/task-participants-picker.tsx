"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";

import type { WorkspaceMember } from "@/features/workspaces/schemas/workspaces.schemas";
import { TaskParticipant } from "../schemas/tasks.schema";

type ParticipantRole = "RESPONSIBLE" | "COLLABORATOR";
type RoleSelection = ParticipantRole | "";

type TaskParticipantsPickerProps = {
  members: WorkspaceMember[];
  currentUserId: string;
  isAdmin: boolean;
  mode?: "create" | "edit";
  initialParticipants?: TaskParticipant[];
  disabled?: boolean;
  errors?: {
    responsibleIds?: string[];
    collaboratorIds?: string[];
  };
};

export default function TaskParticipantsPicker({
  members,
  currentUserId,
  isAdmin,
  mode = "create",
  initialParticipants = [],
  disabled = false,
  errors,
}: TaskParticipantsPickerProps) {
  const [search, setSearch] = useState("");

  const [roles, setRoles] = useState<Record<string, ParticipantRole>>(() => {
    if (mode === "edit") {
      const initialRoles: Record<string, ParticipantRole> = {};

      for (const participant of initialParticipants) {
        initialRoles[participant.userId] = participant.role;
      }

      return initialRoles;
    }

    const isMember = members.some((member) => member.id === currentUserId);

    return !isAdmin && isMember ? { [currentUserId]: "RESPONSIBLE" } : {};
  });

  const normalizedSearch = search.trim().toLocaleLowerCase("es-MX");

  const visibleMembers = members.filter((member) =>
    `${member.name} ${member.email}`
      .toLocaleLowerCase("es-MX")
      .includes(normalizedSearch),
  );

  const responsibleCount = Object.values(roles).filter(
    (role) => role === "RESPONSIBLE",
  ).length;

  const collaboratorCount = Object.values(roles).filter(
    (role) => role === "COLLABORATOR",
  ).length;

  const needsSelfAssignment =
    mode === "create" && !isAdmin && !roles[currentUserId];

  const activeMemberIds = new Set(members.map((member) => member.id));

  const unavailableParticipants = initialParticipants.filter(
    (participant) =>
      roles[participant.userId] !== undefined &&
      !activeMemberIds.has(participant.userId),
  );

  const willLoseAccess = mode === "edit" && !isAdmin && !roles[currentUserId];

  const willLoseEditPermission =
    mode === "edit" && !isAdmin && roles[currentUserId] === "COLLABORATOR";

  function changeRole(userId: string, role: RoleSelection) {
    setRoles((current) => {
      const next = { ...current };

      if (role === "") {
        delete next[userId];
      } else {
        next[userId] = role;
      }

      return next;
    });
  }

  return (
    <section
      aria-labelledby="task-participants-title"
      className="space-y-4 rounded-xl border border-border p-4 sm:p-5"
    >
      <div>
        <h3
          id="task-participants-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <Users aria-hidden="true" size={18} className="text-primary" />
          Participantes
        </h3>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Selecciona al menos un responsable. Los colaboradores son opcionales.
        </p>
      </div>

      {Object.entries(roles).map(([userId, role]) => (
        <input
          key={userId}
          type="hidden"
          name={role === "RESPONSIBLE" ? "responsibleIds" : "collaboratorIds"}
          value={userId}
        />
      ))}

      <div
        aria-live="polite"
        className="flex flex-wrap gap-2 text-xs font-medium"
      >
        <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
          Responsables: {responsibleCount}
        </span>

        <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
          Colaboradores: {collaboratorCount}
        </span>
      </div>

      <div>
        <label htmlFor="task-member-search" className="sr-only">
          Buscar miembros por nombre o correo
        </label>

        <div className="relative">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            id="task-member-search"
            type="search"
            value={search}
            disabled={disabled}
            autoComplete="off"
            placeholder="Buscar miembros del espacio"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
              }
            }}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>
      </div>

      {unavailableParticipants.length > 0 && (
        <div className="rounded-xl border border-progress/20 bg-progress-soft/50 p-4">
          <h4 className="text-sm font-semibold text-progress">
            Participantes que requieren revisión
          </h4>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Estas personas siguen asignadas, pero ya no están disponibles para
            seleccionarlas. Revisa su acceso o retíralas antes de guardar.
          </p>

          <ul className="mt-4 space-y-3">
            {unavailableParticipants.map((participant) => (
              <li
                key={participant.userId}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="wrap-break-words text-sm font-medium">
                    {participant.user.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {roles[participant.userId] === "RESPONSIBLE"
                      ? "Responsable"
                      : "Colaborador"}
                  </p>

                  <span className="mt-2 inline-block rounded-md bg-progress-soft px-2 py-1 text-xs font-medium text-progress">
                    No disponible para asignación
                  </span>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => changeRole(participant.userId, "")}
                  aria-label={`Retirar a ${participant.user.name} de la asignación`}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center self-start rounded-lg border border-danger/20 px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                >
                  Retirar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {members.length === 0 ? (
        <p className="rounded-lg bg-background p-4 text-sm text-muted-foreground">
          Este espacio no tiene miembros activos disponibles. Un administrador
          debe revisar sus asignaciones.
        </p>
      ) : visibleMembers.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">
          No encontramos miembros con esa búsqueda.
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {visibleMembers.map((member) => {
            const role = roles[member.id] ?? "";

            return (
              <li
                key={member.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  role ? "bg-primary-soft/40" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-medium">
                    {member.name}
                    {member.id === currentUserId && (
                      <span className="ml-2 text-xs text-primary">Tú</span>
                    )}
                  </p>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>

                <select
                  aria-label={`Participación de ${member.name} (${member.email})`}
                  value={role}
                  disabled={disabled}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (
                      value === "" ||
                      value === "RESPONSIBLE" ||
                      value === "COLLABORATOR"
                    ) {
                      changeRole(member.id, value);
                    }
                  }}
                  className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  <option value="">Sin asignar</option>

                  <option
                    value="RESPONSIBLE"
                    disabled={role !== "RESPONSIBLE" && responsibleCount >= 100}
                  >
                    Responsable
                  </option>

                  <option
                    value="COLLABORATOR"
                    disabled={
                      role !== "COLLABORATOR" && collaboratorCount >= 100
                    }
                  >
                    Colaborador
                  </option>
                </select>
              </li>
            );
          })}
        </ul>
      )}

      {needsSelfAssignment && (
        <p role="alert" className="text-sm text-danger">
          Debes incluirte como responsable o colaborador de la tarea.
        </p>
      )}

      {willLoseAccess && (
        <p role="status" className="text-sm leading-6 text-progress">
          Si guardas sin incluirte como participante, perderás acceso a esta
          tarea.
        </p>
      )}

      {willLoseEditPermission && (
        <p role="status" className="text-sm leading-6 text-progress">
          Como colaborador podrás consultar la tarea, pero dejarás de tener
          permiso para editar sus datos.
        </p>
      )}

      {Boolean(errors?.responsibleIds?.length) && (
        <p role="alert" className="text-sm text-danger">
          {errors?.responsibleIds?.join(" ")}
        </p>
      )}

      {Boolean(errors?.collaboratorIds?.length) && (
        <p role="alert" className="text-sm text-danger">
          {errors?.collaboratorIds?.join(" ")}
        </p>
      )}
    </section>
  );
}
