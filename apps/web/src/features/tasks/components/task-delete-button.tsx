"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";

import {
  deleteTaskAction,
  type DeleteTaskState,
} from "../actions/delete-task.action";

type TaskDeleteButtonProps = {
  taskId: string;
  taskTitle: string;
  subtaskCount: number;
};

const initialState: DeleteTaskState = { error: "" };

export default function TaskDeleteButton({
  taskId,
  taskTitle,
  subtaskCount,
}: TaskDeleteButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [state, formAction, isPending] = useActionState(
    deleteTaskAction.bind(null, taskId),
    initialState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-danger/20 bg-surface px-4 py-2.5 text-sm font-semibold text-danger shadow-sm transition-colors hover:border-danger/40 hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Trash2 aria-hidden="true" size={17} />
        Eliminar
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-task-title"
        aria-describedby="delete-task-description"
        onCancel={(event) => {
          if (isPending) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <h2 id="delete-task-title" className="text-lg font-semibold">
          ¿Eliminar definitivamente?
        </h2>

        <div
          id="delete-task-description"
          className="mt-3 space-y-2 text-sm text-muted-foreground"
        >
          <p>
            Se eliminará{" "}
            <span className="font-medium wrap-break-words text-foreground">
              {taskTitle}
            </span>
            {subtaskCount > 0 && (
              <>
                {" "}
                junto con{" "}
                <span className="font-medium text-foreground">
                  {subtaskCount} {subtaskCount === 1 ? "subtarea" : "subtareas"}
                </span>
              </>
            )}
            .
          </p>
          <p>
            También se borrarán sus comentarios, adjuntos, historial y
            notificaciones. Esta acción no se puede deshacer.
          </p>
        </div>

        {state.error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {state.error}
          </p>
        )}

        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => dialogRef.current?.close()}
            className="rounded-xl cursor-pointer border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {isPending && (
              <Loader2 aria-hidden="true" size={16} className="animate-spin" />
            )}
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </form>
      </dialog>
    </>
  );
}
