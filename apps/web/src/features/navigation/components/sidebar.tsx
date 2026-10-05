"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CircleHelp,
  House,
  ListTodo,
  ShieldCheck,
  Users,
} from "lucide-react";

type SidebarProps = {
  isAdmin: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({
  isAdmin,
  collapsed = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const isAreas = pathname === "/areas" || pathname.startsWith("/areas/");

  const itemClasses =
    "flex min-h-11 w-full items-center rounded-lg text-sm " +
    "transition-colors focus-visible:outline-2 " +
    "focus-visible:outline-ring";

  const itemLayout = collapsed ? "justify-center px-0" : "gap-3 px-3";

  return (
    <div className={`flex min-h-full flex-col ${collapsed ? "p-3" : "p-4"}`}>
      {/* Navegación principal */}
      <nav aria-label="Navegación principal" className="space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          title={collapsed ? "Inicio" : undefined}
          aria-current={isHome ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            isHome
              ? "bg-primary font-semibold text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-primary-soft hover:text-primary"
          }`}
        >
          <House aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Inicio
          </span>
        </Link>

        <button
          type="button"
          aria-disabled="true"
          title="Mi trabajo — Próximamente"
          className={`${itemClasses} ${itemLayout} cursor-not-allowed text-muted-foreground`}
        >
          <ListTodo aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Mi trabajo
            <span className="sr-only"> — Próximamente</span>
          </span>

          {!collapsed && (
            <span aria-hidden="true" className="ml-auto text-[10px]">
              Próximamente
            </span>
          )}
        </button>
      </nav>

      <div className="my-5 border-t border-border/70" />

      {/* Espacios de trabajo */}
      {/* Áreas y espacios */}
      <nav aria-label="Áreas de trabajo" className="space-y-2">
        {!collapsed && (
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Espacios de trabajo
          </p>
        )}

        <Link
          href="/areas"
          onClick={onNavigate}
          title={collapsed ? "Áreas de trabajo" : undefined}
          aria-current={isAreas ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            isAreas
              ? "bg-primary font-semibold text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-primary-soft hover:text-primary"
          }`}
        >
          <Building2 aria-hidden="true" size={20} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Áreas de trabajo
          </span>
        </Link>

        {!collapsed && (
          <p className="px-3 text-xs leading-5 text-muted-foreground">
            Consulta tus áreas y espacios asignados.
          </p>
        )}
      </nav>

      {/* Administración */}
      {isAdmin && (
        <div className="mt-6">
          {!collapsed && (
            <p className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck aria-hidden="true" size={15} />
              Administración
            </p>
          )}

          <Link
            href="/users"
            onClick={onNavigate}
            title={collapsed ? "Usuarios" : undefined}
            aria-current={
              pathname === "/users" || pathname.startsWith("/users/")
                ? "page"
                : undefined
            }
            className={`${itemClasses} ${itemLayout} ${
              collapsed ? "" : "mt-3"
            } ${
              pathname === "/users" || pathname.startsWith("/users/")
                ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-primary-soft hover:text-primary"
            }`}
          >
            <Users aria-hidden="true" size={19} className="shrink-0" />

            <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
              Usuarios
            </span>
          </Link>
        </div>
      )}

      {/* Ayuda */}
      <div className="mt-auto pt-10">
        {collapsed ? (
          <span
            tabIndex={0}
            aria-label="Ayuda: contacta al administrador de la plataforma."
            title="¿Necesitas ayuda? Contacta al administrador."
            className="flex h-11 items-center justify-center rounded-lg bg-primary-soft text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CircleHelp aria-hidden="true" size={20} />
          </span>
        ) : (
          <div className="rounded-xl bg-primary-soft/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CircleHelp
                aria-hidden="true"
                size={18}
                className="shrink-0 text-primary"
              />
              ¿Necesitas ayuda?
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Contacta al administrador de la plataforma.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
