import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import EditUserForm from "@/features/users/components/edit-user-form";
import { getUser } from "@/features/users/services/users.service";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const result = await getUser(id);

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
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold">No pudimos cargar al usuario</h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>

        <Link
          href="/users"
          className="mt-6 inline-block rounded text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Volver a usuarios
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 rounded text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a usuarios
        </Link>

        <p className="mt-6 text-sm font-medium text-primary">Administración</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Editar usuario
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Actualiza su nombre, acceso global y estado.
        </p>
      </header>

      <EditUserForm key={result.user.id} user={result.user} />
    </div>
  );
}
