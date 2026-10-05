import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, ClipboardList, FolderOpen } from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import {
  getWorkspace,
  getWorkspaceMembers,
} from "@/features/workspaces/services/workspaces.service";
import CreateTaskForm from "@/features/tasks/components/create-task-form";

type NewTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewTaskPage({ params }: NewTaskPageProps) {
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

  const workspaceResult = await getWorkspace(id);

  if (workspaceResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    workspaceResult.status === "not-found" ||
    workspaceResult.status === "forbidden"
  ) {
    notFound();
  }

  if (workspaceResult.status === "unavailable") {
    return <LoadError />;
  }

  const { workspace } = workspaceResult;
  const membersResult = await getWorkspaceMembers(workspace.id);

  if (membersResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    membersResult.status === "not-found" ||
    membersResult.status === "forbidden"
  ) {
    notFound();
  }

  if (membersResult.status === "unavailable") {
    return <LoadError />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={`/workspaces/${workspace.id}`}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a {workspace.name}
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
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-surface text-primary shadow-sm">
            <ClipboardList aria-hidden="true" size={28} />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Organización del trabajo
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Crea una nueva tarea
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Define qué hay que hacer, quiénes participarán y cuándo debe estar
              listo.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/60 bg-surface/80 px-3 py-2 text-xs text-muted-foreground">
                <Building2 aria-hidden="true" size={15} className="shrink-0" />

                <span className="min-w-0 wrap-break-words">
                  {workspace.area.name}
                </span>
              </span>

              <Link
                href={`/workspaces/${workspace.id}`}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-primary/10 bg-surface/80 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <FolderOpen aria-hidden="true" size={15} className="shrink-0" />

                <span className="min-w-0 wrap-break-words">
                  {workspace.name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <CreateTaskForm
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        members={membersResult.result.data}
        currentUserId={profile.user.id}
        isAdmin={profile.user.isAdmin}
      />
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
