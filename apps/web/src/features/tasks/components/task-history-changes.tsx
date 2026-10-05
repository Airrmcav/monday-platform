import { APP_TIME_ZONE } from "@/lib/date-time";

import type {
  TaskHistoryAction,
  TaskHistoryChanges,
} from "../schemas/task-history.schema";

type TaskHistoryChangesProps = {
  action: TaskHistoryAction;
  changes: TaskHistoryChanges;
};

const fields = [
  ["title", "Título"],
  ["description", "Descripción"],
  ["priority", "Prioridad"],
  ["status", "Estado"],
  ["startsAt", "Fecha de inicio"],
  ["dueAt", "Fecha de entrega"],
  ["completedAt", "Fecha de finalización"],
  ["isBlocked", "Bloqueo"],
  ["blockedReason", "Motivo del bloqueo"],
] as const;

type HistoryField = (typeof fields)[number][0];

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completada",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const roleLabels = {
  RESPONSIBLE: "Responsable",
  COLLABORATOR: "Colaborador",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: APP_TIME_ZONE,
});

function formatValue(
  field: HistoryField,
  value: string | boolean | null,
): string {
  if (value === null || value === "") {
    return "Sin definir";
  }

  if (field === "status") {
    return statusLabels[String(value)] ?? String(value);
  }

  if (field === "priority") {
    return priorityLabels[String(value)] ?? String(value);
  }

  if (field === "isBlocked") {
    return value === true ? "Bloqueada" : "Sin bloqueo";
  }

  if (field === "startsAt" || field === "dueAt" || field === "completedAt") {
    return dateFormatter.format(new Date(String(value)));
  }

  return String(value);
}

export default function TaskHistoryChanges({
  action,
  changes,
}: TaskHistoryChangesProps) {
  const isCreation = action === "CREATED";

  const visibleChanges = fields.flatMap(([field, label]) => {
    const change = changes[field];

    if (!change) {
      return [];
    }

    if (!isCreation && change.before === change.after) {
      return [];
    }

    return [
      {
        field,
        label,
        before: formatValue(field, change.before),
        after: formatValue(field, change.after),
      },
    ];
  });

  const previousParticipants = changes.participants?.before ?? [];
  const nextParticipants = changes.participants?.after ?? [];

  const previousById = new Map(
    previousParticipants.map((participant) => [
      participant.userId,
      participant,
    ]),
  );

  const nextById = new Map(
    nextParticipants.map((participant) => [participant.userId, participant]),
  );

  const addedParticipants = nextParticipants.filter(
    (participant) => !previousById.has(participant.userId),
  );

  const removedParticipants = previousParticipants.filter(
    (participant) => !nextById.has(participant.userId),
  );

  const roleChanges = nextParticipants.flatMap((participant) => {
    const previous = previousById.get(participant.userId);

    if (!previous || previous.role === participant.role) {
      return [];
    }

    return [
      {
        userId: participant.userId,
        name: participant.name,
        before: previous.role,
        after: participant.role,
      },
    ];
  });

  const hasParticipantChanges =
    addedParticipants.length > 0 ||
    removedParticipants.length > 0 ||
    roleChanges.length > 0;

  if (visibleChanges.length === 0 && !hasParticipantChanges) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleChanges.length > 0 && (
        <dl className="space-y-4">
          {visibleChanges.map((change) => (
            <div key={change.field}>
              <dt className="text-xs font-semibold text-foreground">
                {change.label}
              </dt>

              <dd
                className={`mt-2 grid gap-2 ${
                  isCreation ? "" : "sm:grid-cols-2"
                }`}
              >
                {!isCreation && (
                  <div className="min-w-0 rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Antes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-muted-foreground">
                      {change.before}
                    </p>
                  </div>
                )}

                <div className="min-w-0 rounded-lg border border-primary/10 bg-primary-soft/40 p-3">
                  <p className="text-xs font-medium text-primary">
                    {isCreation ? "Valor inicial" : "Después"}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-foreground">
                    {change.after}
                  </p>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {hasParticipantChanges && (
        <div>
          <h4 className="text-xs font-semibold">
            {isCreation
              ? "Participantes iniciales"
              : "Cambios en participantes"}
          </h4>

          <ul className="mt-2 space-y-2">
            {addedParticipants.map((participant) => (
              <li
                key={`added-${participant.userId}`}
                className="rounded-lg border border-success/15 bg-success-soft/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="wrap-break-words text-sm font-medium">
                    {participant.name}
                  </span>

                  <span className="rounded bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                    {isCreation ? "Asignado" : "Agregado"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {roleLabels[participant.role]}
                </p>
              </li>
            ))}

            {removedParticipants.map((participant) => (
              <li
                key={`removed-${participant.userId}`}
                className="rounded-lg border border-danger/15 bg-danger-soft/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="wrap-break-words text-sm font-medium">
                    {participant.name}
                  </span>

                  <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                    Retirado
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Antes: {roleLabels[participant.role]}
                </p>
              </li>
            ))}

            {roleChanges.map((participant) => (
              <li
                key={`role-${participant.userId}`}
                className="rounded-lg border border-primary/15 bg-primary-soft/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="wrap-break-words text-sm font-medium">
                    {participant.name}
                  </span>

                  <span className="rounded bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    Cambio de función
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Antes: {roleLabels[participant.before]}
                  <span aria-hidden="true"> · </span>
                  Después: {roleLabels[participant.after]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
