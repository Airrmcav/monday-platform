"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  searchMembersAction,
  type MemberOption,
  type SearchMembersResult,
} from "../actions/search-members-action";
import { WorkspaceEditMember } from "../schemas/workspaces.schemas";

type WorkspaceMembersPickerProps = {
  initialMembers?: WorkspaceEditMember[];
  disabled?: boolean;
  errors?: string[];
};

type MembersPage = Extract<SearchMembersResult, { status: "success" }>;

export default function WorkspaceMembersPicker({
  initialMembers = [],
  disabled = false,
  errors,
}: WorkspaceMembersPickerProps) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({
    search: "",
    page: 1,
  });

  const [selected, setSelected] = useState<WorkspaceEditMember[]>(() => [
    ...initialMembers,
  ]);

  const [result, setResult] = useState<MembersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setMessage("");
      setResult(null);

      try {
        const response = await searchMembersAction(query);

        if (cancelled || currentRequest !== requestId.current) {
          return;
        }

        switch (response.status) {
          case "success":
            setResult(response);
            break;

          case "unauthenticated":
            setMessage(
              "Tu sesión no está disponible. Vuelve a iniciar sesión.",
            );
            break;

          case "forbidden":
            setMessage(
              "Solo los administradores pueden consultar los usuarios.",
            );
            break;

          case "invalid":
            setMessage("Revisa los parámetros de búsqueda.");
            break;

          case "unavailable":
            setMessage("No pudimos cargar los usuarios. Intenta nuevamente.");
            break;
        }
      } catch {
        if (!cancelled && currentRequest === requestId.current) {
          setMessage("No pudimos cargar los usuarios. Intenta nuevamente.");
        }
      } finally {
        if (!cancelled && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [query, retry]);

  function searchMembers() {
    setQuery({
      search: search.trim(),
      page: 1,
    });
  }

  function toggleMember(member: MemberOption) {
    if (disabled) {
      return;
    }

    setSelected((current) => {
      const alreadySelected = current.some((item) => item.id === member.id);

      if (alreadySelected) {
        return current.filter((item) => item.id !== member.id);
      }

      if (current.length >= 100) {
        return current;
      }

      return [
        ...current,
        {
          id: member.id,
          name: member.name,
          email: member.email,
          status: "ACTIVE",
        },
      ];
    });
  }

  function removeMember(userId: string) {
    if (disabled) {
      return;
    }
    setSelected((current) => current.filter((member) => member.id !== userId));
  }

  return (
    <section
      aria-labelledby="workspace-members-title"
      className="space-y-4 rounded-xl border border-border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="workspace-members-title"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Users aria-hidden="true" size={18} className="text-primary" />
            Miembros del espacio
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Selecciona hasta 100 miembros. Las nuevas incorporaciones deben
            corresponder a usuarios activos.
          </p>
        </div>

        <span
          aria-live="polite"
          className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
        >
          {selected.length} seleccionados
        </span>
      </div>
      {selected.map((member) => (
        <input
          key={member.id}
          type="hidden"
          name="memberIds"
          value={member.id}
        />
      ))}

      {selected.length > 0 && (
        <ul
          aria-label="Miembros seleccionados"
          className="flex flex-wrap gap-2"
        >
          {selected.map((member) => {
            const isInactive = member.status === "INACTIVE";

            return (
              <li
                key={member.id}
                className={`flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isInactive
                    ? "border-progress/20 bg-progress-soft text-progress"
                    : "border-primary/10 bg-primary-soft text-primary"
                }`}
              >
                <div className="min-w-0">
                  <span
                    className="block truncate font-medium"
                    title={`${member.name} (${member.email})`}
                  >
                    {member.name}
                  </span>

                  {isInactive && (
                    <span className="mt-0.5 block text-xs">
                      Cuenta inactiva · membresía conservada
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeMember(member.id)}
                  aria-label={`Retirar a ${member.name} (${member.email}) de la selección`}
                  className="shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected.some((member) => member.status === "INACTIVE") && (
        <p className="rounded-lg border border-progress/20 bg-progress-soft/50 p-3 text-xs leading-5 text-progress">
          Hay cuentas inactivas con membresía en este espacio. Puedes
          conservarlas; esto no reactiva sus cuentas. Para retirarlas, primero
          deben quedar sin asignaciones en tareas o subtareas no archivadas.
        </p>
      )}

      <div>
        <label
          htmlFor="workspace-member-search"
          className="text-sm font-medium"
        >
          Buscar por nombre o correo
        </label>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="workspace-member-search"
            type="search"
            value={search}
            disabled={disabled}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                searchMembers();
              }
            }}
            placeholder="Escribe un nombre o correo"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={searchMembers}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            <Search aria-hidden="true" size={16} />
            Buscar
          </button>
        </div>
      </div>

      <div
        aria-busy={loading}
        className="overflow-hidden rounded-lg border border-border"
      >
        {loading ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
          >
            <LoaderCircle
              aria-hidden="true"
              size={18}
              className="animate-spin motion-reduce:animate-none"
            />
            Cargando usuarios…
          </p>
        ) : message ? (
          <div className="space-y-3 p-4">
            <p role="alert" className="text-sm text-danger">
              {message}
            </p>

            <button
              type="button"
              disabled={disabled}
              onClick={() => setRetry((value) => value + 1)}
              className="rounded text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Reintentar
            </button>
          </div>
        ) : result?.members.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No encontramos usuarios activos con esa búsqueda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {result?.members.map((member) => {
              const checked = selected.some((item) => item.id === member.id);

              const selectionDisabled =
                disabled || (!checked && selected.length >= 100);

              return (
                <li key={member.id}>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      checked ? "bg-primary-soft" : "hover:bg-background"
                    } ${
                      selectionDisabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={selectionDisabled}
                      onChange={() => toggleMember(member)}
                      className="h-4 w-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />

                    <span className="min-w-0">
                      <span className="block wrap-break-word text-sm font-medium">
                        {member.name}
                      </span>
                      <span className="block break-all text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && result && result.pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Página {result.pagination.page} de {result.pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled || result.pagination.page <= 1}
              aria-label="Página anterior de usuarios"
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  page: result.pagination.page - 1,
                }))
              }
              className="rounded-lg border border-border p-2 text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>

            <button
              type="button"
              disabled={
                disabled ||
                result.pagination.page >= result.pagination.totalPages
              }
              aria-label="Página siguiente de usuarios"
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  page: result.pagination.page + 1,
                }))
              }
              className="rounded-lg border border-border p-2 text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      )}

      {Boolean(errors?.length) && (
        <p role="alert" className="text-sm text-danger">
          {errors?.join(" ")}
        </p>
      )}
    </section>
  );
}
