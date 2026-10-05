import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/services/auth.service";
import AppShell from "@/features/navigation/components/app-shell";
import { getTaskNotifications } from "@/features/task-notifications/task-notifications.service";

type PrivateLayoutProps = {
  children: ReactNode;
};

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  const result = await getCurrentProfile();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    return (
      <AccessMessage message="No tienes acceso activo a esta plataforma. Contacta al administrador." />
    );
  }

  if (result.status === "unavailable") {
    return (
      <AccessMessage message="No podemos conectar con la plataforma. Intenta nuevamente en unos momentos." />
    );
  }

  const notificationsResult = await getTaskNotifications();

  const notifications = {
    initialNotifications:
      notificationsResult.status === "success"
        ? notificationsResult.result.data
        : [],

    initialUnreadCount:
      notificationsResult.status === "success"
        ? notificationsResult.result.unreadCount
        : 0,

    unavailable: notificationsResult.status === "unavailable",
  };

  return (
    <AppShell
      user={{
        name: result.user.name,
        email: result.user.email,
        isAdmin: result.user.isAdmin,
      }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}

function AccessMessage({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-(--shadow-panel)">
        <h1 className="text-xl font-semibold text-foreground">
          Acceso a MYCAV
        </h1>

        <p className="mt-4 leading-7 text-muted-foreground">{message}</p>

        <Link
          href="/login"
          className="mt-6 inline-block font-medium text-primary underline underline-offset-4"
        >
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
