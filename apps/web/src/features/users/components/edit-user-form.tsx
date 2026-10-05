"use client";

import { useActionState, useState } from "react";
import {
  updateUserAction,
  UpdateUserState,
} from "../actions/update-user-action";
import { UserListItem } from "../schemas/users.schemas";
import { LoaderCircle, Save, UserRoundPen } from "lucide-react";
import Link from "next/link";
import UserAvatarPicker from "./user-avatar-picker";
import {
  removeUserAvatarAction,
} from "../actions/user-avatar-actions";
import {
  uploadUserAvatar,
  validateUserAvatar,
} from "../lib/upload-user-avatar";

type EditUserFormProps = {
  user: UserListItem;
};

const initialState: UpdateUserState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

function FieldErrors({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {messages.join(" ")}
    </p>
  );
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const action = updateUserAction.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarError, setAvatarError] = useState("");
  const [isAvatarPending, setIsAvatarPending] = useState(false);
  const errors = state.fieldErrors;

  async function handleAvatarSelected(file: File | null) {
    if (!file) {
      return;
    }

    const validationError = validateUserAvatar(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarError("");
    setIsAvatarPending(true);
    const result = await uploadUserAvatar(user.id, file);

    if (result.success) {
      setAvatarUrl(result.avatarUrl);
    } else {
      setAvatarError(result.error);
    }
    setIsAvatarPending(false);
  }

  async function handleAvatarRemove() {
    setAvatarError("");
    setIsAvatarPending(true);
    const result = await removeUserAvatarAction(user.id);

    if (result.success) {
      setAvatarUrl(null);
    } else {
      setAvatarError(result.error);
    }
    setIsAvatarPending(false);
  }

  return (
    <section
      aria-labelledby="edit-user-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <UserRoundPen aria-hidden="true" size={24} />
        </div>

        <div className="min-w-0">
          <h2 id="edit-user-title" className="font-semibold">
            Datos y acceso del usuario
          </h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      <form
        action={formAction}
        aria-busy={isPending || isAvatarPending}
        className="p-6"
      >
        <fieldset
          disabled={isPending || isAvatarPending}
          className="min-w-0 space-y-6"
        >
          <legend className="sr-only">Editar usuario</legend>

          <div>
            <UserAvatarPicker
              name={user.name}
              avatarUrl={avatarUrl}
              onFileSelected={handleAvatarSelected}
              disabled={isPending || isAvatarPending}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p
                aria-live="polite"
                className="text-xs text-muted-foreground"
              >
                {isAvatarPending
                  ? "Guardando foto…"
                  : "La foto se guarda al seleccionarla."}
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={isPending || isAvatarPending}
                  className="cursor-pointer text-xs font-medium text-danger underline underline-offset-2 disabled:cursor-wait disabled:opacity-60"
                >
                  Quitar foto
                </button>
              )}
            </div>
            {avatarError && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {avatarError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nombre completo
            </label>

            <input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              autoComplete="off"
              required
              minLength={2}
              maxLength={120}
              aria-invalid={Boolean(errors?.name?.length)}
              aria-describedby={errors?.name?.length ? "name-error" : undefined}
              className={inputClassName}
            />

            <FieldErrors id="name-error" messages={errors?.name} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Acceso global
              </label>

              <select
                id="isAdmin"
                name="isAdmin"
                defaultValue={String(user.isAdmin)}
                aria-invalid={Boolean(errors?.isAdmin?.length)}
                aria-describedby={
                  errors?.isAdmin?.length ? "role-help role-error" : "role-help"
                }
                className={inputClassName}
              >
                <option value="false">Empleado</option>
                <option value="true">Administrador</option>
              </select>

              <p
                id="role-help"
                className="mt-2 text-xs leading-5 text-muted-foreground"
              >
                Los administradores pueden gestionar usuarios y sus accesos.
              </p>

              <FieldErrors id="role-error" messages={errors?.isAdmin} />
            </div>

            <div>
              <label htmlFor="status" className="text-sm font-medium">
                Estado
              </label>

              <select
                id="status"
                name="status"
                defaultValue={user.status}
                aria-invalid={Boolean(errors?.status?.length)}
                aria-describedby={
                  errors?.status?.length
                    ? "status-help status-error"
                    : "status-help"
                }
                className={inputClassName}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>

              <p
                id="status-help"
                className="mt-2 text-xs leading-5 text-muted-foreground"
              >
                Desactivar bloquea el acceso a la plataforma y conserva sus
                datos e historial.
              </p>

              <FieldErrors id="status-error" messages={errors?.status} />
            </div>
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
            {isPending ? (
              <span className="px-4 py-3 text-sm text-muted-foreground">
                Cancelar
              </span>
            ) : (
              <Link
                href="/users"
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
                <Save aria-hidden="true" size={18} />
              )}

              {isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
