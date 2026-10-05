"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FilePenLine, Flag, LoaderCircle, Save } from "lucide-react";

import type { WorkspaceMember } from "@/features/workspaces/schemas/workspaces.schemas";
import type { TaskDetail } from "../schemas/tasks.schema";
import {
  updateTaskAction,
  type UpdateTaskState,
} from "../actions/update-task-action";
import TaskDateFields from "./task-date-fields";
import TaskParticipantsPicker from "./task-participants-picker";

type EditTaskFormProps = {
  task: TaskDetail;
  members: WorkspaceMember[];
  currentUserId: string;
  isAdmin: boolean;
};

const initialState: UpdateTaskState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export default function EditTaskForm({
  task,
  members,
  currentUserId,
  isAdmin,
}: EditTaskFormProps) {
  const action = updateTaskAction.bind(null, task.id);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const errors = state.fieldErrors;
  const taskPath = `/tasks/${task.id}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-5 sm:px-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <FilePenLine aria-hidden="true" size={22} />
        </span>

        <div className="min-w-0">
          <h2 className="text-base font-semibold">Datos de la tarea</h2>

          <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
            {task.workspace.name}
          </p>
        </div>
      </header>

      <form action={formAction} aria-busy={isPending}>
        <fieldset disabled={isPending} className="min-w-0 space-y-6 p-5 sm:p-6">
          <legend className="sr-only">Editar datos de la tarea</legend>

          <div>
            <label htmlFor="edit-task-title" className="text-sm font-medium">
              Título de la tarea
            </label>

            <input
              id="edit-task-title"
              name="title"
              type="text"
              defaultValue={task.title}
              required
              minLength={3}
              maxLength={200}
              aria-invalid={Boolean(errors?.title?.length)}
              aria-describedby={
                errors?.title?.length ? "edit-task-title-error" : undefined
              }
              className={inputClassName}
            />

            {Boolean(errors?.title?.length) && (
              <p
                id="edit-task-title-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.title?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-task-description"
              className="text-sm font-medium"
            >
              Descripción
              <span className="ml-2 font-normal text-muted-foreground">
                Opcional
              </span>
            </label>

            <textarea
              id="edit-task-description"
              name="description"
              defaultValue={task.description ?? ""}
              rows={5}
              maxLength={5000}
              placeholder="Describe el trabajo y los detalles que debe conocer el equipo."
              aria-invalid={Boolean(errors?.description?.length)}
              aria-describedby={
                errors?.description?.length
                  ? "edit-task-description-error"
                  : undefined
              }
              className={`${inputClassName} resize-y`}
            />

            {Boolean(errors?.description?.length) && (
              <p
                id="edit-task-description-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.description?.join(" ")}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/70 p-4 sm:p-5">
            <label
              htmlFor="edit-task-priority"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <Flag aria-hidden="true" size={18} className="text-primary" />
              Prioridad de la tarea
            </label>

            <p
              id="edit-task-priority-help"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Indica qué tan urgente es atender este trabajo.
            </p>

            <select
              id="edit-task-priority"
              name="priority"
              defaultValue={task.priority}
              required
              aria-invalid={Boolean(errors?.priority?.length)}
              aria-describedby={
                errors?.priority?.length
                  ? "edit-task-priority-help edit-task-priority-error"
                  : "edit-task-priority-help"
              }
              className={inputClassName}
            >
              <option value="LOW">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>

            {Boolean(errors?.priority?.length) && (
              <p
                id="edit-task-priority-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.priority?.join(" ")}
              </p>
            )}
          </div>

          <TaskDateFields
            mode="edit"
            initialDueAt={task.dueAt}
            disabled={isPending}
            errors={{
              dueAt: errors?.dueAt,
            }}
          />

          <TaskParticipantsPicker
            mode="edit"
            initialParticipants={task.participants}
            members={members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            disabled={isPending}
            errors={{
              responsibleIds: errors?.responsibleIds,
              collaboratorIds: errors?.collaboratorIds,
            }}
          />
        </fieldset>

        {state.error && (
          <div className="px-5 pb-5 sm:px-6">
            <p
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger"
            >
              {state.error}
            </p>
          </div>
        )}

        <footer className="flex flex-col-reverse gap-3 border-t border-border/60 bg-background/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {!isPending && (
            <Link
              href={taskPath}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
            >
              Cancelar
            </Link>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
                Guardando cambios…
              </>
            ) : (
              <>
                <Save aria-hidden="true" size={18} />
                Guardar cambios
              </>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}
