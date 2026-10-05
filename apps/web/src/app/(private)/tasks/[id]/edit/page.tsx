import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  FilePenLine,
  GitBranch,
  ShieldAlert,
  WifiOff,
} from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import { getTask } from "@/features/tasks/tasks.service";
import { getWorkspaceMembers } from "@/features/workspaces/services/workspaces.service";
import EditTaskForm from "@/features/tasks/components/edit-task-form";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
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
  const taskPath = `/tasks/${task.id}`;
  const isSubtask = task.parentId !== null;

  const backLabel = isSubtask ? "Volver a la subtarea" : "Volver a la tarea";

  const isResponsible = task.participants.some(
    (participant) =>
      participant.userId === profile.user.id &&
      participant.role === "RESPONSIBLE",
  );

  const canEdit = profile.user.isAdmin || isResponsible;

  if (!canEdit) {
    return (
      <AccessMessage
        title="No tienes permiso para editar"
        message="Solo los administradores y responsables pueden modificar estos datos."
        href={taskPath}
        linkLabel={backLabel}
      />
    );
  }

  if (task.status === "COMPLETED") {
    return (
      <AccessMessage
        title={
          isSubtask
            ? "Esta subtarea está completada"
            : "Esta tarea está completada"
        }
        message="Un administrador debe reabrirla antes de modificar sus datos."
        href={taskPath}
        linkLabel={backLabel}
      />
    );
  }

  const parentResult = task.parentId ? await getTask(task.parentId) : null;

  if (parentResult?.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    parentResult?.status === "not-found" ||
    parentResult?.status === "forbidden"
  ) {
    notFound();
  }

  if (parentResult?.status === "unavailable") {
    return <LoadError />;
  }

  const parentTask =
    parentResult?.status === "success" ? parentResult.task : null;

  if (
    parentTask &&
    (parentTask.parentId !== null ||
      parentTask.workspaceId !== task.workspaceId)
  ) {
    notFound();
  }

  if (parentTask?.status === "COMPLETED") {
    return (
      <AccessMessage
        title="La tarea principal está completada"
        message="Un administrador debe reabrir la tarea principal antes de editar esta subtarea."
        href={`/tasks/${parentTask.id}`}
        linkLabel="Volver a la tarea principal"
      />
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

  const parentParticipantIds = parentTask
    ? new Set(parentTask.participants.map((participant) => participant.userId))
    : null;

  const eligibleMembers = parentParticipantIds
    ? membersResult.result.data.filter((member) =>
        parentParticipantIds.has(member.id),
      )
    : membersResult.result.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={taskPath}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {backLabel}
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-r from-primary-soft/70 via-surface to-surface p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-30 border-primary/5"
        />

        <div className="relative flex items-start gap-4 sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
            <FilePenLine aria-hidden="true" size={27} />
          </span>

          <div className="min-w-0">
            <p className="wrap-break-words text-xs font-semibold uppercase tracking-widest text-primary">
              {task.workspace.area.name} · {task.workspace.name}
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {isSubtask ? "Editar subtarea" : "Editar tarea"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Actualiza los detalles, ajusta la entrega y organiza la
              participación del equipo.
            </p>

            {parentTask && (
              <div className="mt-5 rounded-xl border border-primary/15 bg-surface/80 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <GitBranch aria-hidden="true" size={15} />
                  Tarea principal
                </p>

                <Link
                  href={`/tasks/${parentTask.id}`}
                  className="mt-2 inline-block max-w-full rounded wrap-break-words text-sm font-medium hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {parentTask.title}
                </Link>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Solo puedes asignar participantes de la principal que sean
                  miembros activos del espacio.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <EditTaskForm
        key={task.id}
        task={task}
        members={eligibleMembers}
        currentUserId={profile.user.id}
        isAdmin={profile.user.isAdmin}
      />
    </div>
  );
}

type AccessMessageProps = {
  title: string;
  message: string;
  href: string;
  linkLabel: string;
};

function AccessMessage({
  title,
  message,
  href,
  linkLabel,
}: AccessMessageProps) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-surface p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <ShieldAlert aria-hidden="true" size={24} />
      </span>

      <h1 className="mt-4 text-xl font-semibold">{title}</h1>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>

      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {linkLabel}
      </Link>
    </section>
  );
}

function LoadError() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-surface p-6 sm:p-8">
      <WifiOff aria-hidden="true" size={30} className="text-muted-foreground" />

      <h1 className="mt-4 text-xl font-semibold">
        No pudimos preparar la edición
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
