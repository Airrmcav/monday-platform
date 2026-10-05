import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Users } from "lucide-react";

import type { UsersResponse } from "../schemas/users.schemas";
import UserAvatar from "./user-avatar";

type UsersTableProps = {
  result: UsersResponse;
  search?: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

export default function UsersTable({ result, search = "" }: UsersTableProps) {
  const { data: users, pagination } = result;
  const { page, pageSize, total, totalPages } = pagination;

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const firstItem = users.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const lastItem = users.length > 0 ? firstItem + users.length - 1 : 0;

  const paginationButton =
    "inline-flex min-h-10 items-center justify-center gap-2 " +
    "rounded-lg border border-border px-3 text-sm font-medium";

  function pageHref(targetPage: number) {
    const query = new URLSearchParams({
      page: String(targetPage),
      pageSize: String(pageSize),
    });

    if (search) {
      query.set("search", search);
    }

    return `/users?${query.toString()}`;
  }

  return (
    <section
      aria-labelledby="users-table-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-panel)"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-5 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Users aria-hidden="true" size={21} />
        </span>

        <div>
          <h2 id="users-table-title" className="font-semibold text-foreground">
            Usuarios de la empresa
          </h2>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {result.pagination.total}{" "}
            {search ? "usuarios encontrados" : "usuarios registrados"}
          </p>
        </div>
      </header>

      {users.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-medium text-foreground">
            {search
              ? "No encontramos usuarios con ese nombre o correo."
              : "Todavía no hay usuarios registrados."}
          </p>

          {total > 0 && (
            <Link
              href={pageHref(1)}
              className="mt-4 inline-block rounded font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Volver a la primera página
            </Link>
          )}
        </div>
      ) : (
        <div
          role="region"
          aria-label="Listado de usuarios con desplazamiento horizontal"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <table className="w-full min-w-190 text-left text-sm">
            <caption className="sr-only">
              Usuarios, correos, estados de acceso y fechas de registro.
            </caption>

            <thead className="border-b border-border/60 bg-surface-hover text-muted-foreground">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Acceso global
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Fecha de registro
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-muted-foreground"
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {users.map((user) => {
                const isActive = user.status === "ACTIVE";

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          userId={user.id}
                          name={user.name}
                          avatarUrl={user.avatarUrl}
                          className="h-10 w-10 bg-primary-soft text-xs font-bold text-primary"
                        />

                        <div className="min-w-0">
                          <p className="wrap-break-word font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isActive
                            ? "bg-success-soft text-success"
                            : "bg-pending-soft text-pending"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-current"
                        />
                        {isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                          user.isAdmin
                            ? "bg-primary-soft text-primary"
                            : "bg-surface-hover text-muted-foreground"
                        }`}
                      >
                        {user.isAdmin ? "Administrador" : "Empleado"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      <time dateTime={user.createdAt}>
                        {dateFormatter.format(new Date(user.createdAt))}
                      </time>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <Link
                        href={`/users/${user.id}/edit`}
                        aria-label={`Editar a ${user.name}`}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/20 bg-primary-soft px-3.5 py-2 text-sm font-semibold text-primary shadow-sm transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <Pencil aria-hidden="true" size={16} strokeWidth={2} />
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="flex flex-col gap-4 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-xs leading-5 text-muted-foreground">
          <p>
            Mostrando {firstItem}–{lastItem} de {total}
          </p>
          <p>Fechas en hora de Ciudad de México.</p>
        </div>

        <nav
          aria-label="Paginación de usuarios"
          className="flex flex-wrap items-center gap-3"
        >
          {hasPreviousPage ? (
            <Link
              href={pageHref(page - 1)}
              className={`${paginationButton} text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring`}
            >
              <ChevronLeft aria-hidden="true" size={16} />
              Anterior
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${paginationButton} text-muted-foreground opacity-50`}
            >
              <ChevronLeft aria-hidden="true" size={16} />
              Anterior
            </span>
          )}

          <span className="text-sm text-muted-foreground">
            {totalPages === 0
              ? "Sin páginas"
              : `Página ${page} de ${totalPages}`}
          </span>

          {hasNextPage ? (
            <Link
              href={pageHref(page + 1)}
              className={`${paginationButton} text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring`}
            >
              Siguiente
              <ChevronRight aria-hidden="true" size={16} />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${paginationButton} text-muted-foreground opacity-50`}
            >
              Siguiente
              <ChevronRight aria-hidden="true" size={16} />
            </span>
          )}
        </nav>
      </footer>
    </section>
  );
}
