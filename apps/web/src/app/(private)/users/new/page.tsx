import CreateUserForm from "@/features/users/components/create-user-form";
import { getUsers } from "@/features/users/services/users.service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const access = await getUsers({ page: 1, pageSize: 1 });

  if (access.status === "unauthenticated") {
    redirect("/login");
  }
  if (access.status === "forbidden") {
    redirect("/dashboard");
  }

  if (access.status === "unavailable") {
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
          Crear usuario
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Registra un empleado y define su acceso a MYCAV.
        </p>
      </header>

      <CreateUserForm />
    </div>
  );
}
