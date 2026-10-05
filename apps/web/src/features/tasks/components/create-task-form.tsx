"use client";

import { WorkspaceMember } from "@/features/workspaces/schemas/workspaces.schemas";
import {
  createTaskAction,
  CreateTaskState,
} from "../actions/create-task-action";
import { useActionState } from "react";
import Link from "next/link";
import { ClipboardPlus, GitBranch, LoaderCircle, Plus } from "lucide-react";
import TaskParticipantsPicker from "./task-participants-picker";
import TaskDateFields from "./task-date-fields";
import { createSubtaskAction } from "../actions/create-subtask-action";

type CreateTaskFormProps = {
  workspaceId: string;
  workspaceName: string;
  members: WorkspaceMember[];
  currentUserId: string;
  isAdmin: boolean;
  parentTask?: {
    id: string;
    title: string;
    participantIds: string[];
  };
};

const initialState: CreateTaskState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export default function CreateTaskForm({
  workspaceId,
  workspaceName,
  members,
  currentUserId,
  isAdmin,
  parentTask,
}: CreateTaskFormProps) {
  const isSubtask = parentTask !== undefined;

  const action = parentTask
    ? createSubtaskAction.bind(null, workspaceId, parentTask.id)
    : createTaskAction.bind(null, workspaceId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const errors = state.fieldErrors;

  const availableMembers = parentTask
    ? members.filter((member) => parentTask.participantIds.includes(member.id))
    : members;

  const hasMembers = availableMembers.length > 0;

  const cancelHref = parentTask
    ? `/tasks/${parentTask.id}`
    : `/workspaces/${workspaceId}`;

  return (
    <section
      aria-labelledby="create-task-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {isSubtask ? (
            <GitBranch aria-hidden="true" size={24} />
          ) : (
            <ClipboardPlus aria-hidden="true" size={24} />
          )}
        </div>

        <div className="min-w-0">
          <h2 id="create-task-title" className="font-semibold">
            {isSubtask ? "Datos de la subtarea" : "Datos de la tarea"}
          </h2>

          <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
            Espacio: {workspaceName}
          </p>
        </div>
      </div>

      <form action={formAction} aria-busy={isPending} className="p-6">
        <fieldset disabled={isPending} className="min-w-0 space-y-6">
          <legend className="sr-only">
            {isSubtask ? "Crear subtarea" : "Crear tarea"}
          </legend>

          {parentTask && (
            <div className="rounded-xl border border-primary/15 bg-primary-soft/40 p-4">
              <p className="text-xs font-semibold text-primary">
                Tarea principal
              </p>

              <p className="mt-2 wrap-break-words text-sm font-medium leading-6">
                {parentTask.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Puedes asignar participantes de esta tarea principal que sean
                miembros activos del espacio.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="text-sm font-medium">
              Título
            </label>

            <input
              id="task-title"
              name="title"
              type="text"
              autoComplete="off"
              placeholder={
                isSubtask
                  ? "Por ejemplo: Revisar instalaciones eléctricas"
                  : "Por ejemplo: Elaborar planos ejecutivos"
              }
              required
              minLength={3}
              maxLength={200}
              aria-invalid={Boolean(errors?.title?.length)}
              aria-describedby={
                errors?.title?.length ? "task-title-error" : undefined
              }
              className={inputClassName}
            />

            {Boolean(errors?.title?.length) && (
              <p id="task-title-error" className="mt-2 text-sm text-danger">
                {errors?.title?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="task-priority" className="text-sm font-medium">
              Prioridad
            </label>

            <select
              id="task-priority"
              name="priority"
              defaultValue="NORMAL"
              required
              aria-invalid={Boolean(errors?.priority?.length)}
              aria-describedby={
                errors?.priority?.length
                  ? "task-priority-help task-priority-error"
                  : "task-priority-help"
              }
              className={inputClassName}
            >
              <option value="LOW">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>

            <p
              id="task-priority-help"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Indica qué atención requiere este trabajo. Las alertas por fecha
              de entrega se calculan por separado.
            </p>

            {Boolean(errors?.priority?.length) && (
              <p id="task-priority-error" className="mt-2 text-sm text-danger">
                {errors?.priority?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="task-description" className="text-sm font-medium">
              Descripción
              <span className="ml-2 font-normal text-muted-foreground">
                Opcional
              </span>
            </label>

            <textarea
              id="task-description"
              name="description"
              rows={4}
              maxLength={5000}
              placeholder="Describe el trabajo y el resultado esperado."
              aria-invalid={Boolean(errors?.description?.length)}
              aria-describedby={
                errors?.description?.length
                  ? "task-description-error"
                  : undefined
              }
              className={`${inputClassName} resize-y`}
            />

            {Boolean(errors?.description?.length) && (
              <p
                id="task-description-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.description?.join(" ")}
              </p>
            )}
          </div>

          <TaskDateFields
            mode="create"
            disabled={isPending}
            errors={{
              dueAt: errors?.dueAt,
            }}
          />

          <TaskParticipantsPicker
            key={parentTask?.id ?? workspaceId}
            mode="create"
            members={availableMembers}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            disabled={isPending}
            errors={{
              responsibleIds: errors?.responsibleIds,
              collaboratorIds: errors?.collaboratorIds,
            }}
          />

          {!hasMembers && (
            <p
              role="alert"
              className="rounded-xl bg-progress-soft p-4 text-sm leading-6 text-progress"
            >
              {isSubtask
                ? "No hay participantes disponibles para asignar. Revisa que la tarea principal tenga participantes activos en el espacio."
                : "No hay miembros activos disponibles. Un administrador debe asignar miembros al espacio antes de crear tareas."}
            </p>
          )}

          <p className="rounded-xl bg-primary-soft p-4 text-sm leading-6">
            {isSubtask
              ? "La subtarea se creará como Pendiente. Sus participantes tendrán acceso mientras conserven su asignación a la tarea principal y su membresía en el espacio."
              : "La tarea se creará como Pendiente. Sus participantes tendrán acceso mientras conserven su asignación y su membresía en el espacio."}
          </p>

          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger"
            >
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
            {!isPending && (
              <Link
                href={cancelHref}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
              >
                Cancelar
              </Link>
            )}

            <button
              type="submit"
              disabled={isPending || !hasMembers}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Plus aria-hidden="true" size={18} />
              )}

              {isPending
                ? isSubtask
                  ? "Creando subtarea…"
                  : "Creando tarea…"
                : isSubtask
                  ? "Crear subtarea"
                  : "Crear tarea"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
