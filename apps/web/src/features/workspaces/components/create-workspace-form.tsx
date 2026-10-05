"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FolderPlus, LoaderCircle, Plus } from "lucide-react";

import {
  createWorkspaceAction,
  type CreateWorkspaceState,
} from "../actions/create-workspace-action";
import WorkspaceMembersPicker from "./workspace-members-picker";

type CreateWorkspaceFormProps = {
  areaId: string;
  areaName: string;
};

const initialState: CreateWorkspaceState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export default function CreateWorkspaceForm({
  areaId,
  areaName,
}: CreateWorkspaceFormProps) {
  const action = createWorkspaceAction.bind(null, areaId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const errors = state.fieldErrors;

  return (
    <section
      aria-labelledby="create-workspace-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <FolderPlus aria-hidden="true" size={24} />
        </div>

        <div className="min-w-0">
          <h2 id="create-workspace-title" className="font-semibold">
            Datos del espacio
          </h2>

          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
            Área: {areaName}
          </p>
        </div>
      </div>

      <form action={formAction} aria-busy={isPending} className="p-6">
        <fieldset disabled={isPending} className="min-w-0 space-y-6">
          <legend className="sr-only">Crear espacio de trabajo</legend>

          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nombre del espacio
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              placeholder="Por ejemplo: Obra Monterrey"
              required
              minLength={2}
              maxLength={120}
              aria-invalid={Boolean(errors?.name?.length)}
              aria-describedby={errors?.name?.length ? "name-error" : undefined}
              className={inputClassName}
            />

            {Boolean(errors?.name?.length) && (
              <p id="name-error" className="mt-2 text-sm text-danger">
                {errors?.name?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
              <span className="ml-2 font-normal text-muted-foreground">
                Opcional
              </span>
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Describe el objetivo del espacio o de la obra."
              aria-invalid={Boolean(errors?.description?.length)}
              aria-describedby={
                errors?.description?.length
                  ? "description-help description-error"
                  : "description-help"
              }
              className={`${inputClassName} resize-y`}
            />

            <p
              id="description-help"
              className="mt-2 text-xs text-muted-foreground"
            >
              Máximo 1000 caracteres.
            </p>

            {Boolean(errors?.description?.length) && (
              <p id="description-error" className="mt-2 text-sm text-danger">
                {errors?.description?.join(" ")}
              </p>
            )}
          </div>

          <WorkspaceMembersPicker
            disabled={isPending}
            errors={errors?.memberIds}
          />

          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
            {!isPending && (
              <Link
                href={`/areas/${areaId}`}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
              >
                Cancelar
              </Link>
            )}

            <button
              type="submit"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
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

              {isPending ? "Creando espacio…" : "Crear espacio"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
