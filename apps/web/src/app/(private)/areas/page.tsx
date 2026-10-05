import { getAreas } from "@/features/areas/services/areas.service";
import { getCurrentProfile } from "@/features/auth/services/auth.service";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  FolderOpen,
  LayoutGrid,
  Plus,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const areaColors = [
  {
    cover: "bg-[#e5f1ff]",
    icon: "bg-[#0073ea]",
    accent: "bg-[#0073ea]",
  },
  {
    cover: "bg-[#eee9ff]",
    icon: "bg-[#784bd1]",
    accent: "bg-[#784bd1]",
  },
  {
    cover: "bg-[#def5ef]",
    icon: "bg-[#00866a]",
    accent: "bg-[#00866a]",
  },
  {
    cover: "bg-[#fff0e5]",
    icon: "bg-[#b85b00]",
    accent: "bg-[#b85b00]",
  },
];

function getAreaColors(id: string) {
  const hash = Array.from(id).reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );

  return areaColors[hash % areaColors.length];
}

const creationDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

export default async function AreasPage() {
  const result = await getAreas();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <ShieldAlert aria-hidden="true" size={32} className="text-danger" />

        <h1 className="mt-4 text-xl font-semibold">Acceso restringido</h1>

        <p className="mt-2 text-muted-foreground">
          No tienes acceso a esta sección.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Volver al inicio
        </Link>
      </section>
    );
  }

  if (result.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <WifiOff
          aria-hidden="true"
          size={32}
          className="text-muted-foreground"
        />

        <h1 className="mt-4 text-xl font-semibold">
          No pudimos cargar las áreas
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const profile = await getCurrentProfile();
  const canCreate = "user" in profile && profile.user.isAdmin;
  const areas = result.result.data;

  return (
    <div className="min-w-0 space-y-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
        <div className="relative overflow-hidden px-6 py-8 sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary-soft/70 via-surface to-surface"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-36 border-primary/5"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-surface text-primary shadow-sm sm:h-16 sm:w-16">
                <Building2 aria-hidden="true" size={30} />
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  Organización del equipo
                </p>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Áreas de trabajo
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Cada equipo tiene su espacio. Encuentra tus proyectos y
                  continúa donde lo dejaste.
                </p>
              </div>
            </div>

            {canCreate && (
              <Link
                href="/areas/new"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:self-center"
              >
                <Plus aria-hidden="true" size={19} />
                Nueva área
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-surface px-6 sm:px-8">
          <div className="inline-flex items-center gap-2 border-b-2 border-primary py-4 text-sm font-semibold text-primary">
            <LayoutGrid aria-hidden="true" size={17} />
            Áreas disponibles
            <span className="ml-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs">
              {areas.length}
            </span>
          </div>

          <p className="hidden text-xs text-muted-foreground sm:block">
            Tu equipo, conectado
          </p>
        </div>
      </header>

      <section aria-labelledby="areas-list-title">
        {areas.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FolderOpen aria-hidden="true" size={30} />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              {canCreate
                ? "Todo empieza con un área"
                : "Tus áreas aparecerán aquí"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {canCreate
                ? "Crea la primera área para organizar los espacios y proyectos de tu equipo."
                : "Cuando te asignen a un espacio de trabajo, podrás acceder a su área desde esta sección."}
            </p>

            {canCreate && (
              <Link
                href="/areas/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Plus aria-hidden="true" size={17} />
                Crear primera área
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {areas.map((area) => {
              const colors = getAreaColors(area.id);

              return (
                <li key={area.id} className="min-w-0">
                  <Link
                    href={`/areas/${area.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-(--shadow-panel) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
                  >
                    <div
                      aria-hidden="true"
                      className={`relative h-32 overflow-hidden ${colors.cover}`}
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-white/35 to-transparent" />

                      <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-28 border-white/30" />

                      <div className="absolute -bottom-20 left-12 h-36 w-36 rounded-full border-20 border-white/25" />

                      <div className="absolute right-8 top-7 h-24 w-32 rotate-12 rounded-xl border border-white/70 bg-white/35" />

                      <div className="absolute right-12 top-5 h-24 w-32 -rotate-6 rounded-xl border border-white/90 bg-white/80 p-4 shadow-sm transition-transform duration-200 group-hover:rotate-0 motion-reduce:transition-none">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-5 w-5 rounded-md ${colors.accent}`}
                          />
                          <span className="h-2 w-14 rounded-full bg-foreground/10" />
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="h-1.5 w-full rounded-full bg-foreground/10" />
                          <div className="h-1.5 w-3/4 rounded-full bg-foreground/10" />
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-1 flex-col px-6 pb-5">
                      <span
                        aria-hidden="true"
                        className={`-mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-surface text-white shadow-sm ${colors.icon}`}
                      >
                        <Building2 size={26} />
                      </span>

                      <div className="pb-5 pt-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Área de trabajo
                        </p>

                        <h3 className="mt-1.5 wrap-break-words text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                          {area.name}
                        </h3>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/60 pt-4">
                        <div className="flex min-w-0 items-start gap-2.5 text-muted-foreground">
                          <CalendarDays
                            aria-hidden="true"
                            size={17}
                            className="mt-0.5 shrink-0"
                          />

                          <div className="min-w-0">
                            <p className="text-xs">Fecha de creación</p>

                            <time
                              dateTime={area.createdAt}
                              className="mt-1 block text-xs font-medium leading-5 text-foreground"
                            >
                              {creationDateFormatter.format(
                                new Date(area.createdAt),
                              )}
                            </time>
                          </div>
                        </div>

                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight aria-hidden="true" size={19} />
                          <span className="sr-only">Abrir área</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
