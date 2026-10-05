"use client";

import { useActionState } from "react";
import { LoaderCircle, ShieldAlert, Unlock } from "lucide-react";

import {
  updateTaskBlockAction,
  type UpdateTaskBlockState,
} from "../actions/update-task-block-action";
import type { TaskStatus } from "../schemas/tasks.schema";

type TaskBlockFormProps = {
  taskId: string;
  status: TaskStatus;
  isBlocked: boolean;
  blockedReason: string | null;
};

const initialState: UpdateTaskBlockState = {
  error: "",
};

export default function TaskBlockForm({
  taskId,
  status,
  isBlocked,
  blockedReason,
}: TaskBlockFormProps) {
  const action = updateTaskBlockAction.bind(null, taskId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const isCompleted = status === "COMPLETED";
  const reasonError = state.fieldErrors?.blockedReason?.join(" ");

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldAlert aria-hidden="true" size={20} className="text-primary" />
        Bloqueo de la tarea
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {isCompleted
          ? isBlocked
            ? "Puedes retirar el bloqueo pendiente de esta tarea completada."
            : "No se puede bloquear una tarea completada."
          : isBlocked
            ? "Actualiza el motivo o retira el bloqueo cuando se resuelva el impedimento."
            : "Indica qué impide avanzar. El bloqueo no cambia el estado de la tarea."}
      </p>

      <form
        action={formAction}
        aria-busy={isPending}
        className="mt-5 space-y-4"
      >
        {!isCompleted && (
          <div>
            <label
              htmlFor="task-block-reason"
              className="block text-sm font-medium"
            >
              Motivo del bloqueo
            </label>

            <textarea
              key={JSON.stringify([isBlocked, blockedReason])}
              id="task-block-reason"
              name="blockedReason"
              defaultValue={blockedReason ?? ""}
              rows={3}
              required
              minLength={3}
              maxLength={1000}
              disabled={isPending}
              placeholder="Por ejemplo: Falta recibir los planos actualizados."
              aria-invalid={Boolean(reasonError)}
              aria-describedby={
                reasonError ? "task-block-reason-error" : undefined
              }
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />

            {reasonError && (
              <p
                id="task-block-reason-error"
                className="mt-2 text-sm text-danger"
              >
                {reasonError}
              </p>
            )}
          </div>
        )}

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

        <div className="flex flex-col gap-3">
          {!isCompleted && (
            <button
              type="submit"
              name="operation"
              value="block"
              disabled={isPending}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldAlert aria-hidden="true" size={17} />
              {isBlocked ? "Actualizar motivo" : "Bloquear tarea"}
            </button>
          )}

          {isBlocked && (
            <button
              type="submit"
              name="operation"
              value="unblock"
              formNoValidate
              disabled={isPending}
              className="inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Unlock aria-hidden="true" size={17} />
              Desbloquear tarea
            </button>
          )}
        </div>

        {isPending && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <LoaderCircle
              aria-hidden="true"
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
            Guardando cambio…
          </p>
        )}
      </form>
    </section>
  );
}
