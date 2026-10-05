"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  CreateUserState,
} from "../actions/create-user-action";
import { Eye, EyeOff, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import UserAvatarPicker from "./user-avatar-picker";
import {
  uploadUserAvatar,
  validateUserAvatar,
} from "../lib/upload-user-avatar";

const initialState: CreateUserState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

type FieldErrorsProps = {
  id: string;
  messages?: string[];
};

function FieldErrors({ id, messages }: FieldErrorsProps) {
  if (!messages?.length) {
    return null;
  }
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {messages.join(" ")}
    </p>
  );
}

export default function CreateUserForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const errors = state.fieldErrors;

  useEffect(() => {
    if (!avatarPreview?.startsWith("blob:")) {
      return;
    }

    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    if (!state.createdUserId) {
      return;
    }
    const createdUserId = state.createdUserId;

    if (!avatarFile) {
      router.replace("/users");
      return;
    }

    let isCurrent = true;

    void (async () => {
      await Promise.resolve();
      if (!isCurrent) {
        return;
      }

      setIsAvatarUploading(true);
      setAvatarError("");
      const result = await uploadUserAvatar(createdUserId, avatarFile);

      if (!isCurrent) {
        return;
      }

      if (result.success) {
        router.replace("/users");
      } else if (result.unauthenticated) {
        router.replace("/login");
      } else {
        setAvatarError(
          `El usuario se creó, pero no pudimos guardar su foto. ${result.error}`,
        );
      }
      setIsAvatarUploading(false);
    })();

    return () => {
      isCurrent = false;
    };
  }, [avatarFile, router, state.createdUserId]);

  async function retryAvatarUpload() {
    const userId = state.createdUserId;
    if (!userId || !avatarFile) {
      return;
    }

    setIsAvatarUploading(true);
    setAvatarError("");
    const result = await uploadUserAvatar(userId, avatarFile);

    if (result.success) {
      router.replace("/users");
    } else if (result.unauthenticated) {
      router.replace("/login");
    } else {
      setAvatarError(
        `El usuario se creó, pero no pudimos guardar su foto. ${result.error}`,
      );
    }
    setIsAvatarUploading(false);
  }

  return (
    <section
      aria-labelledby="create-user-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <UserPlus aria-hidden="true" size={24} />
        </div>

        <div>
          <h2 id="create-user-title" className="font-semibold">
            Datos del nuevo usuario
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La cuenta quedará activa al completar el registro.
          </p>
        </div>
      </div>

      <form
        action={formAction}
        aria-busy={isPending || isAvatarUploading}
        className="p-6"
      >
        <fieldset
          disabled={isPending || Boolean(state.createdUserId) || isAvatarUploading}
          className="min-w-0 space-y-6"
        >
          <legend className="sr-only">Información del usuario</legend>

          <UserAvatarPicker
            name={name}
            avatarUrl={avatarPreview}
            onFileSelected={(file) => {
              setAvatarError("");
              if (!file) {
                return;
              }

              const validationError = validateUserAvatar(file);
              if (validationError) {
                setAvatarError(validationError);
                return;
              }

              setAvatarFile(file);
              setAvatarPreview(URL.createObjectURL(file));
            }}
            disabled={Boolean(state.createdUserId) || isAvatarUploading}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Nombre completo
              </label>

              <input
                id="name"
                name="name"
                type="text"
                onChange={(event) => setName(event.currentTarget.value)}
                autoComplete="off"
                required
                minLength={2}
                maxLength={120}
                aria-invalid={Boolean(errors?.name?.length)}
                aria-describedby={
                  errors?.name?.length ? "name-error" : undefined
                }
                className={inputClassName}
              />

              <FieldErrors id="name-error" messages={errors?.name} />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={254}
                aria-invalid={Boolean(errors?.email?.length)}
                aria-describedby={
                  errors?.email?.length ? "email-error" : undefined
                }
                className={inputClassName}
              />

              <FieldErrors id="email-error" messages={errors?.email} />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  minLength={12}
                  maxLength={128}
                  aria-invalid={Boolean(errors?.password?.length)}
                  aria-describedby={
                    errors?.password?.length
                      ? "password-help password-error"
                      : "password-help"
                  }
                  className={`${inputClassName} pr-14`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-controls="password"
                  className="absolute cursor-pointer right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={19} />
                  ) : (
                    <Eye aria-hidden="true" size={19} />
                  )}
                </button>
              </div>

              <p
                id="password-help"
                className="mt-2 text-xs leading-5 text-muted-foreground"
              >
                Entre 12 y 128 caracteres. Entrega esta contraseña al empleado
                para que pueda iniciar sesión.
              </p>

              <FieldErrors id="password-error" messages={errors?.password} />
            </div>

            <div>
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Acceso global
              </label>

              <select
                id="isAdmin"
                name="isAdmin"
                defaultValue="false"
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
                Los administradores pueden gestionar usuarios. Los permisos de
                cada proyecto se asignan por separado.
              </p>

              <FieldErrors id="role-error" messages={errors?.isAdmin} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-primary-soft p-4 text-sm">
            <ShieldCheck
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-primary"
            />
            <p className="leading-6">
              El usuario podrá entrar con su correo y contraseña, sin invitación
              ni confirmación por correo.
            </p>
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
              {isPending || isAvatarUploading ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <UserPlus aria-hidden="true" size={18} />
              )}

              {isPending
                ? "Creando usuario…"
                : isAvatarUploading
                  ? "Guardando foto…"
                  : state.createdUserId
                    ? "Usuario creado"
                    : "Crear usuario"}
            </button>
          </div>
        </fieldset>
        {avatarError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <p>{avatarError}</p>
            {state.createdUserId && avatarFile && !isAvatarUploading && (
              <button
                type="button"
                onClick={retryAvatarUpload}
                className="mt-2 cursor-pointer font-semibold underline underline-offset-2"
              >
                Reintentar subida
              </button>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
