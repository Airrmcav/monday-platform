"use client";
import { useActionState } from "react";
import {
  updateTaskStatusAction,
  UpdateTaskStatusState,
} from "../actions/update-task-status-action";
import { TaskStatus } from "../schemas/tasks.schema";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";

type TaskStatusFormProps = {
  taskId: string;
  currentStatus: TaskStatus;
  isAdmin: boolean;
};

const initialState: UpdateTaskStatusState = {
  error: "",
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "COMPLETED", label: "Completada" },
];

export default function TaskStatusForm({
  taskId,
  currentStatus,
  isAdmin,
}: TaskStatusFormProps) {
  const action = updateTaskStatusAction.bind(null, taskId);

  const [state, formAction, isPending] = useActionState(action, initialState);
  const isLocked = !isAdmin && currentStatus === "COMPLETED";
  const fieldError = state.fieldErrors?.status?.[0];

  const availableOptions = statusOptions.filter(
    (option) =>
      isAdmin || option.value !== "COMPLETED" || currentStatus === "COMPLETED",
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <CheckCircle2 aria-hidden="true" size={20} className="text-primary" />
        Actualizar estado
      </h2>

      <p
        id="task-status-help"
        className="mt-2 text-sm leading-6 text-muted-foreground"
      >
        {isLocked
          ? "Esta tarea está completada. Solo un administrador puede reabrirla."
          : isAdmin
            ? "Puedes cambiar el estado, completar o reabrir la tarea."
            : "Actualiza el avance. El administrador confirmará su finalización."}
      </p>

      <form
        action={formAction}
        aria-busy={isPending}
        className="mt-5 space-y-4"
      >
        <div>
          <label htmlFor="task-status" className="block text-sm font-medium">
            Estado
          </label>

          <select
            key={currentStatus}
            id="task-status"
            name="status"
            defaultValue={currentStatus}
            disabled={isPending || isLocked}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError
                ? "task-status-help task-status-error"
                : "task-status-help"
            }
            className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {availableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {fieldError && (
            <p id="task-status-error" className="mt-2 text-sm text-danger">
              {fieldError}
            </p>
          )}
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}

        {state.success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || isLocked}
          className="inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <LoaderCircle
              aria-hidden="true"
              size={17}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Save aria-hidden="true" size={17} />
          )}

          {isPending ? "Guardando…" : "Guardar estado"}
        </button>
      </form>
    </section>
  );
}
