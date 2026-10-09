import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, UserRound } from "lucide-react";

import UserAvatar from "@/features/users/components/user-avatar";
import { getUserProfile } from "@/features/users/services/users.service";

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;
  const result = await getUserProfile(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    redirect("/dashboard");
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-(--shadow-panel)">
        <h1 className="text-xl font-semibold">No pudimos cargar el perfil</h1>
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const { profile } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Volver
        </Link>
        <p className="mt-6 text-sm font-medium text-primary">Personas</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Perfil de usuario
        </h1>
      </header>

      <section
        aria-label={`Perfil de ${profile.name}`}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-panel)"
      >
        <div className="h-2 bg-primary" />
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <UserAvatar
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            taskSummary={profile.taskSummary}
            className="h-28 w-28 border-4 border-primary-soft bg-primary-soft text-2xl font-semibold text-primary"
          />

          <div className="min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:justify-start">
              <UserRound aria-hidden="true" size={15} />
              Usuario
            </div>
            <h2 className="mt-2 wrap-break-words text-2xl font-semibold">
              {profile.name}
            </h2>
            <a
              href={`mailto:${profile.email}`}
              className="mt-3 inline-flex max-w-full items-center justify-center gap-2 break-all text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring sm:justify-start"
            >
              <Mail aria-hidden="true" size={16} className="shrink-0" />
              {profile.email}
            </a>
          </div>
        </div>

        <div className="border-t border-border/60 px-6 py-4 text-xs text-muted-foreground sm:px-8">
          Información de solo lectura
        </div>
      </section>
    </div>
  );
}
