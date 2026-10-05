"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Building2, LoaderCircle, Plus } from "lucide-react";

import {
  createAreaAction,
  type CreateAreaState,
} from "../actions/create-area-action";

const initialState: CreateAreaState = {
  error: "",
};

export default function CreateAreaForm() {
  const [state, formAction, isPending] = useActionState(
    createAreaAction,
    initialState,
  );

  const nameErrors = state.fieldErrors?.name;

  return (
    <section
      aria-labelledby="create-area-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Building2 aria-hidden="true" size={24} />
        </div>

        <div>
          <h2 id="create-area-title" className="font-semibold">
            Datos del área
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Agrupa los espacios de trabajo de tu equipo.
          </p>
        </div>
      </div>

      <form action={formAction} aria-busy={isPending} className="p-6">
        <fieldset disabled={isPending} className="min-w-0 space-y-6">
          <legend className="sr-only">Crear área</legend>

          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nombre del área
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              placeholder="Por ejemplo: Arquitectura"
              required
              minLength={2}
              maxLength={100}
              aria-invalid={Boolean(nameErrors?.length)}
              aria-describedby={
                nameErrors?.length
                  ? "area-name-help area-name-error"
                  : "area-name-help"
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />

            <p
              id="area-name-help"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Después podrás agregar espacios y obras dentro del área.
            </p>

            {Boolean(nameErrors?.length) && (
              <p id="area-name-error" className="mt-2 text-sm text-danger">
                {nameErrors?.join(" ")}
              </p>
            )}
          </div>

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
                href="/areas"
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

              {isPending ? "Creando área…" : "Crear área"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
