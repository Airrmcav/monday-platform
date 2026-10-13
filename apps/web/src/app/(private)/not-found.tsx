import GoBackButton from "@/components/go-back-button";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Compass,
  FileQuestion,
  LayoutDashboard,
  Link2Off,
  ListChecks,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

const quickLinks = [
  {
    href: "/my-work",
    title: "Mi trabajo",
    description: "Tus tareas asignadas y pendientes.",
    icon: ListChecks,
  },
  {
    href: "/areas",
    title: "Áreas de trabajo",
    description: "Explora los espacios de cada equipo.",
    icon: Building2,
  },
  {
    href: "/calendar",
    title: "Calendario",
    description: "Fechas de entrega y eventos.",
    icon: CalendarDays,
  },
  {
    href: "/meetings",
    title: "Reuniones",
    description: "Próximas reuniones y convocatorias.",
    icon: Users,
  },
];

const possibleCauses = [
  {
    icon: Link2Off,
    title: "Enlace incorrecto",
    description: "La dirección pudo escribirse mal o estar incompleta.",
  },
  {
    icon: Trash2,
    title: "Elemento eliminado",
    description: "La tarea o el espacio ya no existe en la plataforma.",
  },
  {
    icon: ShieldAlert,
    title: "Sin acceso",
    description: "No formas parte del espacio o no tienes permiso para verlo.",
  },
];

export default function NotFound() {
  return (
    <div className="min-w-0 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary-soft/70 via-surface to-surface"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-30 border-primary/5"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 right-6 select-none text-[10rem] font-bold leading-none tracking-tighter text-primary/5 sm:text-[14rem]"
        >
          404
        </div>

        <div className="relative flex flex-col gap-6 p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white bg-surface text-primary shadow-sm">
              <FileQuestion aria-hidden="true" size={28} />
            </span>

            <div className="min-w-0 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Error 404
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                No encontramos lo que buscas
              </h1>

              <p className="mt-3 text-muted-foreground">
                La página que intentas abrir no está disponible. Puedes volver a
                donde estabas o continuar desde una de las secciones
                principales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <LayoutDashboard aria-hidden="true" size={17} />
              Ir al inicio
            </Link>

            <Link
              href="/areas"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Compass aria-hidden="true" size={17} />
              Explorar áreas
            </Link>

            <GoBackButton />
          </div>
        </div>
      </section>

      <section aria-labelledby="quick-links-title" className="space-y-3">
        <h2
          id="quick-links-title"
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Accesos rápidos
        </h2>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ href, title, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full items-start gap-4 rounded-2xl border border-border/70 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon aria-hidden="true" size={21} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{title}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={16}
                      className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </span>

                  <span className="mt-1 block text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="causes-title"
        className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm"
      >
        <h2 id="causes-title" className="font-semibold">
          ¿Por qué pudo pasar?
        </h2>

        <ul className="mt-4 grid gap-5 sm:grid-cols-3">
          {possibleCauses.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <Icon aria-hidden="true" size={18} />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
