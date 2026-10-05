import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FolderOpen,
  Layers3,
} from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import CreateAreaForm from "@/features/areas/components/create-area-form";

const organizationLevels = [
  {
    icon: Building2,
    title: "Área",
    description: "Agrupa el trabajo de un departamento.",
    example: "Arquitectura",
    color: "bg-primary-soft text-primary",
  },
  {
    icon: FolderOpen,
    title: "Espacio de trabajo",
    description: "Organiza una obra o un proyecto dentro del área.",
    example: "Obra residencial",
    color: "bg-review-soft text-review",
  },
  {
    icon: ClipboardList,
    title: "Tarea",
    description: "Define una actividad, sus responsables y su entrega.",
    example: "Elaborar planos",
    color: "bg-success-soft text-success",
  },
];

export default async function NewAreaPage() {
  const profile = await getCurrentProfile();

  if (profile.status === "unauthenticated") {
    redirect("/login");
  }

  if (profile.status === "forbidden") {
    redirect("/dashboard");
  }

  if (profile.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold">
          No pudimos verificar tu acceso
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  if (!profile.user.isAdmin) {
    redirect("/areas");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/areas"
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a áreas
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary-soft/70 via-surface to-surface"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-30 border-primary/5"
        />

        <div className="relative flex items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-surface text-primary shadow-sm">
            <Building2 aria-hidden="true" size={28} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Organización del equipo
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Crea una nueva área
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Dale un lugar al trabajo de tu equipo. Después podrás agregar
              espacios para sus proyectos y obras.
            </p>
          </div>
        </div>
      </header>

      <div className="">
        <div className="min-w-0">
          <CreateAreaForm />
        </div>
      </div>
    </div>
  );
}
