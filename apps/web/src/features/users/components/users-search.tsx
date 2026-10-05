import { Search, X } from "lucide-react";
import Link from "next/link";

type UsersSearchProps = {
  search: string;
  pageSize: number;
};

export default function UsersSearch({ search, pageSize }: UsersSearchProps) {
  return (
    <form
      action="/users"
      method="get"
      role="search"
      aria-label="Buscar usuarios"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value={pageSize} />

      <div className="min-w-0 flex-1">
        <label htmlFor="users-search" className="text-sm font-medium">
          Buscar usuarios
        </label>

        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            id="users-search"
            name="search"
            type="search"
            defaultValue={search}
            maxLength={120}
            placeholder="Nombre o correo electrónico"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search aria-hidden="true" size={17} />
        Buscar
      </button>

      {search && (
        <Link
          href={`/users?page=1&pageSize=${pageSize}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" size={17} />
          Limpiar
        </Link>
      )}
    </form>
  );
}
