"use client";

import { useActionState, useState } from "react";
import { login } from "@/features/auth/actions/login-action";

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {visible ? (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5.5 0 9 7 9 7a17 17 0 0 1-3 3.9" />
          <path d="M6.2 6.2A19 19 0 0 0 3 12s3.5 7 9 7a10 10 0 0 0 5-1.5" />
        </>
      ) : (
        <>
          <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(login, {
    error: "",
  });

  const inputClasses =
    "mt-2 min-h-14 w-full rounded-xl border border-input-border " +
    "bg-surface px-4 py-3.5 text-base text-foreground outline-none " +
    "transition-colors placeholder:text-muted-foreground " +
    "hover:border-primary/60 focus:border-primary focus:ring-4 " +
    "focus:ring-ring/15 read-only:bg-surface-hover";

  return (
    <main className="min-h-dvh bg-background p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-[1600px] overflow-hidden rounded-[28px] border border-border/60 bg-surface shadow-(--shadow-panel) lg:grid-cols-[1.1fr_1fr]">
        {/* Panel visual */}
        <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-[#181b45] p-10 text-white lg:flex xl:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -right-32 -top-32 h-125 w-125 rounded-full bg-[#6161ff]/30 blur-[100px]" />
            <div className="absolute -bottom-40 -left-32 h-110 w-110 rounded-full bg-primary/30 blur-[100px]" />
            <div className="absolute right-10 top-1/3 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full border border-white/5" />
          </div>

          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-15 w-15 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20"
            >
              <img src="/Icon.webp" alt="" />
            </span>

            <span className="text-xl font-bold tracking-[0.12em]">
              MYCAV Services
            </span>
          </div>

          <div className="relative my-14">
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-white/80">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#00ca72]"
              />
              Un espacio para todo tu equipo
            </div>

            <h2 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
              Grandes proyectos.
              <br />
              <span className="text-[#aeb6ff]">Cada detalle,</span>
              <br />
              bajo control.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Organiza tus tareas, conecta con tu equipo y mantén cada entrega
              en movimiento.
            </p>

            <div aria-hidden="true" className="relative mt-12 max-w-lg">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-white/10 bg-white/5" />

              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm xl:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-[#aeb6ff]" />
                    <span className="text-sm font-semibold">
                      Cada etapa cuenta
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <span className="h-1 w-1 rounded-full bg-white/50" />
                    <span className="h-1 w-1 rounded-full bg-white/50" />
                    <span className="h-1 w-1 rounded-full bg-white/50" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-md border border-white/25" />
                    <span className="h-2 flex-1 rounded-full bg-white/20" />
                    <span className="rounded-md bg-[#fdab3d] px-3 py-1.5 text-xs font-semibold text-[#422600]">
                      En progreso
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-md border border-white/25" />
                    <span className="h-2 flex-1 rounded-full bg-white/20" />
                    <span className="rounded-md bg-[#d8d2ff] px-3 py-1.5 text-xs font-semibold text-[#43308a]">
                      En revisión
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#00ca72] text-[#123d2c]">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          d="m3 8 3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="h-2 flex-1 rounded-full bg-white/20" />
                    <span className="rounded-md bg-[#00ca72] px-3 py-1.5 text-xs font-semibold text-[#123d2c]">
                      Completada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs tracking-wide text-white/65">
            Administración · Contabilidad · Arquitectura
          </p>
        </aside>

        {/* Formulario */}
        <section
          aria-labelledby="login-title"
          className="flex flex-col px-6 py-8 sm:px-12 lg:px-10 xl:px-16"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-lg font-bold tracking-widest text-primary lg:hidden">
              MYCAV
            </span>

            <span className="ml-auto rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Acceso interno
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-12 lg:py-16">
            <div className="w-full max-w-110">
              <div
                aria-hidden="true"
                className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  <rect x="5" y="10" width="14" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>
              </div>

              <h1
                id="login-title"
                className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              >
                Bienvenido de nuevo
              </h1>

              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Ingresa para continuar con tus proyectos.
              </p>

              <form
                action={formAction}
                aria-busy={isPending}
                className="mt-9 space-y-6"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="nombre@mycav.com.mx"
                    required
                    readOnly={isPending}
                    aria-describedby={state.error ? "login-error" : undefined}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Ingresa tu contraseña"
                      required
                      readOnly={isPending}
                      aria-describedby={state.error ? "login-error" : undefined}
                      className={`${inputClasses} pr-14`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label="Mostrar contraseña"
                      aria-pressed={showPassword}
                      aria-controls="password"
                      title={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute cursor-pointer right-1.5 top-1/2 mt-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                {state.error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger"
                  >
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex cursor-pointer min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
                      />
                      Verificando acceso…
                    </>
                  ) : (
                    <>
                      Ingresar
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-sm leading-6 text-muted-foreground">
                ¿Necesitas ayuda para entrar? Contacta al administrador de la
                plataforma.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            MYCAV · Plataforma de gestión interna
          </p>
        </section>
      </div>
    </main>
  );
}
