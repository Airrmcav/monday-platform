import { getCurrentProfile } from "@/features/auth/services/auth.service";
import EditWorkspaceForm from "@/features/workspaces/components/edit-workspace-form";
import { getWorkspaceforEdit } from "@/features/workspaces/services/workspaces.service";
import { ArrowLeft, FolderPen, WifiOff } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type EditWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkspacePage({
  params,
}: EditWorkspacePageProps) {
  const { id } = await params;

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

  const result = await getWorkspaceforEdit(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    redirect("/areas");
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return <LoadError />;
  }

  const { workspace } = result;
  const workspacePath = `/workspaces/${workspace.id}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={workspacePath}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Volver al espacio
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-r from-primary-soft/70 via-surface to-surface p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-30 border-primary/5"
        />

        <div className="relative flex items-start gap-4 sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
            <FolderPen aria-hidden="true" size={27} />
          </span>

          <div className="min-w-0">
            <p className="wrap-break-words text-xs font-semibold uppercase tracking-widest text-primary">
              {workspace.area.name}
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Editar espacio de trabajo
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Actualiza la información del espacio y administra las personas que
              tienen acceso.
            </p>

            <p className="mt-3 wrap-break-words text-sm font-medium">
              {workspace.name}
            </p>
          </div>
        </div>
      </header>

      <EditWorkspaceForm key={workspace.id} workspace={workspace} />
    </div>
  );
}

function LoadError() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-surface p-6 sm:p-8">
      <WifiOff aria-hidden="true" size={30} className="text-muted-foreground" />

      <h1 className="mt-4 text-xl font-semibold">
        No pudimos preparar la edición del espacio
      </h1>

      <p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">
        Intenta recargar la página en unos momentos.
      </p>

      <Link
        href="/areas"
        className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Volver a áreas
      </Link>
    </section>
  );
}
