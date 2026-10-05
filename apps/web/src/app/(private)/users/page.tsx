import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, WifiOff } from "lucide-react";

import { getUsers } from "@/features/users/services/users.service";
import UsersTable from "@/features/users/components/users-table";
import UsersSearch from "@/features/users/components/users-search";

type UsersPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    search?: string | string[];
  }>;
};

function parsePositiveInteger(
  value: string | string[] | undefined,
  defaultValue: number,
): number | null {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : null;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  if (params.search !== undefined && typeof params.search !== "string") {
    redirect("/users");
  }

  const search = (params.search ?? "").trim();

  if (search.length > 120) {
    redirect("/users");
  }

  const page = parsePositiveInteger(params.page, 1);
  const pageSize = parsePositiveInteger(params.pageSize, 10);

  if (
    page === null ||
    pageSize === null ||
    pageSize > 100 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    redirect("/users");
  }

  const result = await getUsers({ page, pageSize, search });

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <ShieldAlert aria-hidden="true" size={32} className="text-danger" />

        <h1 className="mt-4 text-xl font-semibold">Acceso restringido</h1>

        <p className="mt-2 text-muted-foreground">
          Solo los administradores pueden consultar los usuarios.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Volver al inicio
        </Link>
      </section>
    );
  }

  if (result.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <WifiOff
          aria-hidden="true"
          size={32}
          className="text-muted-foreground"
        />

        <h1 className="mt-4 text-xl font-semibold">
          No pudimos cargar los usuarios
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const lastPage = Math.max(1, result.result.pagination.totalPages);

  if (page > lastPage) {
    const query = new URLSearchParams({
      page: String(lastPage),
      pageSize: String(pageSize),
    });

    if (search) {
      query.set("search", search);
    }

    redirect(`/users?${query.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Administración</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Usuarios</h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Consulta los empleados y su acceso a la plataforma.
        </p>
        <Link
          href="/users/new"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Crear usuario
        </Link>
      </header>

      <UsersSearch
        key={`${search}:${pageSize}`}
        search={search}
        pageSize={pageSize}
      />

      <UsersTable result={result.result} search={search} />
    </div>
  );
}
