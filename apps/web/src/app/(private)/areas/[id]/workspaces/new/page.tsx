import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, FolderOpen } from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import { getAreas } from "@/features/areas/services/areas.service";
import { areaSchema } from "@/features/areas/schemas/areas.schemas";
import CreateWorkspaceForm from "@/features/workspaces/components/create-workspace-form";

type NewWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewWorkspacePage({
  params,
}: NewWorkspacePageProps) {
  const { id } = await params;

  const idValidation = areaSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    notFound();
  }

  const profile = await getCurrentProfile();

  if (profile.status === "unauthenticated") {
    redirect("/login");
  }

  if (profile.status === "forbidden") {
    redirect("/dashboard");
  }

  if (profile.status === "unavailable") {
    return <LoadError />;
  }

  if (!profile.user.isAdmin) {
    redirect("/areas");
  }

  const areasResult = await getAreas();

  if (areasResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (areasResult.status === "forbidden") {
    redirect("/areas");
  }

  if (areasResult.status === "unavailable") {
    return <LoadError />;
  }

  const area = areasResult.result.data.find(
    (item) => item.id === idValidation.data,
  );

  if (!area) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={`/areas/${area.id}`}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a {area.name}
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
            <FolderOpen aria-hidden="true" size={28} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Organización del equipo
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Crea un espacio de trabajo
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Organiza una obra o proyecto y selecciona a los miembros que
              trabajarán en él.
            </p>

            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-primary/10 bg-surface/80 px-3 py-2 text-xs">
              <Building2
                aria-hidden="true"
                size={15}
                className="shrink-0 text-primary"
              />

              <span className="min-w-0 wrap-break-words text-muted-foreground">
                Área:{" "}
                <span className="font-semibold text-foreground">
                  {area.name}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <CreateWorkspaceForm areaId={area.id} areaName={area.name} />
    </div>
  );
}

function LoadError() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8">
      <h1 className="text-xl font-semibold">
        No pudimos preparar el formulario
      </h1>

      <p role="alert" className="mt-2 text-muted-foreground">
        Intenta recargar la página en unos momentos.
      </p>

      <Link
        href="/areas"
        className="mt-6 inline-block rounded text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        Volver a áreas
      </Link>
    </section>
  );
}
