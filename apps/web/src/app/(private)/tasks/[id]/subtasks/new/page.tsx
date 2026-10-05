import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, GitBranch, ShieldAlert, WifiOff } from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import { getTask } from "@/features/tasks/tasks.service";
import { getWorkspaceMembers } from "@/features/workspaces/services/workspaces.service";
import CreateTaskForm from "@/features/tasks/components/create-task-form";

type NewSubtaskPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewSubtaskPage({ params }: NewSubtaskPageProps) {
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

  const taskResult = await getTask(id);

  if (taskResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (taskResult.status === "not-found" || taskResult.status === "forbidden") {
    notFound();
  }

  if (taskResult.status === "unavailable") {
    return <LoadError />;
  }

  const { task } = taskResult;

  if (task.parentId !== null) {
    notFound();
  }

  const taskPath = `/tasks/${task.id}`;

  if (task.status === "COMPLETED") {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-surface p-6 sm:p-8">
        <ShieldAlert aria-hidden="true" size={30} className="text-primary" />

        <h1 className="mt-4 text-xl font-semibold">
          La tarea principal está completada
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Un administrador debe reabrirla antes de agregar subtareas.
        </p>

        <Link
          href={taskPath}
          className="mt-6 inline-flex items-center gap-2 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a la tarea
        </Link>
      </section>
    );
  }

  const membersResult = await getWorkspaceMembers(task.workspaceId);

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

  const participantIds = task.participants.map(
    (participant) => participant.userId,
  );

  const participantIdSet = new Set(participantIds);

  const eligibleMembers = membersResult.result.data.filter((member) =>
    participantIdSet.has(member.id),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={taskPath}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Volver a la tarea principal
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-r from-primary-soft/70 via-surface to-surface p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-30 border-primary/5"
        />

        <div className="relative flex items-start gap-4 sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
            <GitBranch aria-hidden="true" size={27} />
          </span>

          <div className="min-w-0">
            <p className="wrap-break-words text-xs font-semibold uppercase tracking-widest text-primary">
              {task.workspace.area.name} · {task.workspace.name}
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Crear subtarea
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Divide el trabajo en una actividad concreta, asigna participantes
              y establece su entrega.
            </p>
          </div>
        </div>
      </header>

      <CreateTaskForm
        key={task.id}
        workspaceId={task.workspaceId}
        workspaceName={task.workspace.name}
        members={eligibleMembers}
        currentUserId={profile.user.id}
        isAdmin={profile.user.isAdmin}
        parentTask={{
          id: task.id,
          title: task.title,
          participantIds,
        }}
      />
    </div>
  );
}

function LoadError() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-surface p-6 sm:p-8">
      <WifiOff aria-hidden="true" size={30} className="text-muted-foreground" />

      <h1 className="mt-4 text-xl font-semibold">
        No pudimos preparar el formulario
      </h1>

      <p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">
        Intenta recargar la página en unos momentos.
      </p>

      <Link
        href="/areas"
        className="mt-6 inline-flex items-center gap-2 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Volver a áreas
      </Link>
    </section>
  );
}
