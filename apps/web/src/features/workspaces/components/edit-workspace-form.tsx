"use client";

import { useActionState } from "react";
import {
  updateWorkspaceAction,
  UpdateWorkspaceState,
} from "../actions/update-workspace-action";
import { WorkspaceForEdit } from "../schemas/workspaces.schemas";
import Link from "next/link";
import { FolderPen, LoaderCircle, Save } from "lucide-react";
import WorkspaceMembersPicker from "./workspace-members-picker";

type EditWorkspaceFormProps = {
  workspace: WorkspaceForEdit;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const initialState: UpdateWorkspaceState = {
  error: "",
};

export default function EditWorkspaceForm({
  workspace,
}: EditWorkspaceFormProps) {
  const action = updateWorkspaceAction.bind(null, workspace.id);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const errors = state.fieldErrors;

  return (
    <section
      aria-labelledby="edit-workspace-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <header className="flex items-center gap-4 border-b border-border px-6 py-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <FolderPen aria-hidden="true" size={24} />
        </span>

        <div className="min-w-0">
          <h2 id="edit-workspace-title" className="font-semibold">
            Datos del espacio
          </h2>

          <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
            Área: {workspace.area.name}
          </p>
        </div>
      </header>

      <form action={formAction} aria-busy={isPending} className="p-6">
        <fieldset disabled={isPending} className="min-w-0 space-y-6">
          <legend className="sr-only">Editar espacio de trabajo</legend>

          <div>
            <label
              htmlFor="edit-workspace-name"
              className="text-sm font-medium"
            >
              Nombre del espacio
            </label>

            <input
              id="edit-workspace-name"
              name="name"
              type="text"
              defaultValue={workspace.name}
              autoComplete="off"
              required
              minLength={2}
              maxLength={120}
              aria-invalid={Boolean(errors?.name?.length)}
              aria-describedby={
                errors?.name?.length ? "edit-workspace-name-error" : undefined
              }
              className={inputClassName}
            />

            {Boolean(errors?.name?.length) && (
              <p
                id="edit-workspace-name-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.name?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-workspace-description"
              className="text-sm font-medium"
            >
              Descripción
              <span className="ml-2 font-normal text-muted-foreground">
                Opcional
              </span>
            </label>

            <textarea
              id="edit-workspace-description"
              name="description"
              defaultValue={workspace.description ?? ""}
              rows={4}
              maxLength={1000}
              placeholder="Describe el objetivo del espacio o de la obra."
              aria-invalid={Boolean(errors?.description?.length)}
              aria-describedby={
                errors?.description?.length
                  ? "edit-workspace-description-help edit-workspace-description-error"
                  : "edit-workspace-description-help"
              }
              className={`${inputClassName} resize-y`}
            />

            <p
              id="edit-workspace-description-help"
              className="mt-2 text-xs text-muted-foreground"
            >
              Máximo 1000 caracteres.
            </p>

            {Boolean(errors?.description?.length) && (
              <p
                id="edit-workspace-description-error"
                className="mt-2 text-sm text-danger"
              >
                {errors?.description?.join(" ")}
              </p>
            )}
          </div>

          <WorkspaceMembersPicker
            key={workspace.id}
            initialMembers={workspace.members}
            disabled={isPending}
            errors={errors?.memberIds}
          />

          <p className="rounded-xl bg-primary-soft p-4 text-sm leading-6">
            Los nuevos miembros podrán acceder al espacio. Para consultar sus
            tareas y subtareas deberán estar asignados a ellas. Las
            modificaciones se aplicarán al guardar.
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
                href={`/workspaces/${workspace.id}`}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
              >
                Cancelar
              </Link>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Save aria-hidden="true" size={18} />
              )}

              {isPending ? "Guardando cambios…" : "Guardar cambios"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
