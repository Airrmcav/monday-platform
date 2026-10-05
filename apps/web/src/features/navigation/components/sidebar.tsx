"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FolderKanban,
  FileSpreadsheet,
  House,
  ListTodo,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { WorkspaceNavigationArea } from "../navigation.types";

type SidebarProps = {
  isAdmin: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  areas?: WorkspaceNavigationArea[];
  areasUnavailable?: boolean;
};

export default function Sidebar({
  isAdmin,
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  areas = [],
  areasUnavailable = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const isHome = pathname === "/dashboard";
  const isMyWork =
    pathname === "/my-work" ||
    pathname.startsWith("/my-work") ||
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/workspaces/");
  const isAreas = pathname === "/areas" || pathname.startsWith("/areas/");
  const isReports = pathname === "/reports";
  const activeAreaId = areas.find(
    (area) =>
      pathname === `/areas/${area.id}` ||
      pathname.startsWith(`/areas/${area.id}/`) ||
      area.workspaces.some(
        (workspace) =>
          pathname === `/workspaces/${workspace.id}` ||
          pathname.startsWith(`/workspaces/${workspace.id}/`),
      ),
  )?.id;
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedActiveAreas, setCollapsedActiveAreas] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleArea(areaId: string) {
    const isExpanded =
      expandedAreas.has(areaId) ||
      (activeAreaId === areaId && !collapsedActiveAreas.has(areaId));

    if (activeAreaId === areaId) {
      setCollapsedActiveAreas((current) => {
        const next = new Set(current);
        if (isExpanded) {
          next.add(areaId);
        } else {
          next.delete(areaId);
        }
        return next;
      });
    }

    setExpandedAreas((current) => {
      const next = new Set(current);
      if (isExpanded) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  }

  const itemClasses =
    "group relative flex min-h-11 w-full items-center rounded-lg text-sm " +
    "transition-colors focus-visible:outline-2 " +
    "focus-visible:outline-ring";

  const itemLayout = collapsed ? "justify-center px-0" : "gap-3 px-3";

  return (
    <div className={`flex min-h-full flex-col ${collapsed ? "p-2.5" : "p-3"}`}>
      <div
        className={`mb-5 flex min-h-10 items-center ${
          collapsed ? "justify-center" : "justify-between gap-2 px-2"
        }`}
      >
        {!collapsed && (
          <span className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Navegación
          </span>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={
              collapsed ? "Expandir barra lateral" : "Contraer barra lateral"
            }
            aria-expanded={!collapsed}
            aria-controls="desktop-navigation"
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring lg:flex"
          >
            {collapsed ? (
              <ChevronRight aria-hidden="true" size={17} />
            ) : (
              <ChevronLeft aria-hidden="true" size={17} />
            )}
          </button>
        )}
      </div>

      {/* Navegación principal */}
      <nav aria-label="Navegación principal" className="space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          title={collapsed ? "Inicio" : undefined}
          aria-current={isHome ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            isHome
              ? "bg-primary-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary"
              : "text-foreground hover:bg-surface-hover"
          }`}
        >
          <House aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Inicio
          </span>
        </Link>

        <Link
          href="/my-work"
          onClick={onNavigate}
          title={collapsed ? "Mi trabajo" : undefined}
          aria-current={isMyWork ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            isMyWork
              ? "bg-primary-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary"
              : "text-foreground hover:bg-surface-hover"
          }`}
        >
          <ListTodo aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Mi trabajo
          </span>
        </Link>

        <Link
          href="/calendar"
          onClick={onNavigate}
          title={collapsed ? "Calendario" : undefined}
          aria-current={pathname === "/calendar" ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            pathname === "/calendar"
              ? "bg-primary-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary"
              : "text-foreground hover:bg-surface-hover"
          }`}
        >
          <CalendarDays aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Calendario
          </span>
        </Link>

        <Link
          href="/reports"
          onClick={onNavigate}
          title={collapsed ? "Reportes" : undefined}
          aria-current={isReports ? "page" : undefined}
          className={`${itemClasses} ${itemLayout} ${
            isReports
              ? "bg-primary-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary"
              : "text-foreground hover:bg-surface-hover"
          }`}
        >
          <FileSpreadsheet aria-hidden="true" size={19} className="shrink-0" />

          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
            Reportes
          </span>
        </Link>
      </nav>

      {!collapsed && (
        <nav aria-label="Accesos rápidos" className="mt-4 space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Enfoque
          </p>
          <Link
            href="/my-work?focus=overdue"
            onClick={onNavigate}
            aria-current={
              pathname === "/my-work" && focus === "overdue" ? "page" : undefined
            }
            className={`${itemClasses} gap-3 px-3 ${
              pathname === "/my-work" && focus === "overdue"
                ? "bg-danger-soft font-medium text-danger"
                : "text-foreground hover:bg-surface-hover"
            }`}
          >
            <AlertTriangle
              aria-hidden="true"
              size={18}
              className="shrink-0 text-danger"
            />
            <span className="whitespace-nowrap">Tareas vencidas</span>
          </Link>
          <Link
            href="/my-work?focus=upcoming"
            onClick={onNavigate}
            aria-current={
              pathname === "/my-work" && focus === "upcoming" ? "page" : undefined
            }
            className={`${itemClasses} gap-3 px-3 ${
              pathname === "/my-work" && focus === "upcoming"
                ? "bg-progress-soft font-medium text-progress"
                : "text-foreground hover:bg-surface-hover"
            }`}
          >
            <CalendarClock
              aria-hidden="true"
              size={18}
              className="shrink-0 text-progress"
            />
            <span className="whitespace-nowrap">Próximas entregas</span>
          </Link>
        </nav>
      )}

      <div className="my-4 border-t border-border/70" />

      <nav aria-label="Áreas de trabajo" className="space-y-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Organización
          </p>
        )}

        {collapsed ? (
          <Link
            href="/areas"
            onClick={onNavigate}
            title="Áreas de trabajo"
            aria-current={isAreas ? "page" : undefined}
            className={`${itemClasses} ${itemLayout} ${
              isAreas
                ? "bg-primary-soft font-semibold text-primary"
                : "text-foreground hover:bg-surface-hover"
            }`}
          >
            <Building2 aria-hidden="true" size={20} className="shrink-0" />
            <span className="sr-only">Áreas de trabajo</span>
          </Link>
        ) : (
          <>
            <Link
              href="/areas"
              onClick={onNavigate}
              aria-current={pathname === "/areas" ? "page" : undefined}
              className={`${itemClasses} gap-2.5 px-3 ${
                pathname === "/areas"
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-foreground hover:bg-surface-hover"
              }`}
            >
              <Building2 aria-hidden="true" size={17} className="shrink-0" />
              <span className="whitespace-nowrap">Áreas de trabajo</span>
            </Link>
            {areas.map((area) => {
              const isExpanded =
                expandedAreas.has(area.id) ||
                (activeAreaId === area.id &&
                  !collapsedActiveAreas.has(area.id));
              const isAreaActive =
                pathname === `/areas/${area.id}` ||
                pathname.startsWith(`/areas/${area.id}/`);
              const isWorkspaceActive = area.workspaces.some(
                (workspace) =>
                  pathname === `/workspaces/${workspace.id}` ||
                  pathname.startsWith(`/workspaces/${workspace.id}/`),
              );

              return (
                <div key={area.id}>
                  <div
                    className={`flex min-h-10 items-center rounded-lg pr-1 transition-colors ${
                      isAreaActive || isWorkspaceActive
                        ? "bg-primary-soft/70"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    <Link
                      href={`/areas/${area.id}`}
                      onClick={onNavigate}
                      aria-current={isAreaActive ? "page" : undefined}
                      className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                        isAreaActive || isWorkspaceActive
                          ? "font-medium text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <Building2
                        aria-hidden="true"
                        size={17}
                        className="shrink-0"
                      />
                      <span className="truncate">{area.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${area.name}`}
                      aria-expanded={isExpanded}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <ChevronRight
                        aria-hidden="true"
                        size={15}
                        className={`transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-border/70 pl-2">
                      {area.workspaces.length > 0 ? (
                        area.workspaces.map((workspace) => {
                          const active =
                            pathname === `/workspaces/${workspace.id}` ||
                            pathname.startsWith(
                              `/workspaces/${workspace.id}/`,
                            );

                          return (
                            <Link
                              key={workspace.id}
                              href={`/workspaces/${workspace.id}`}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={`flex min-h-9 items-center gap-2 rounded-md px-2 text-[13px] ${
                                active
                                  ? "bg-primary-soft font-medium text-primary"
                                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                              }`}
                            >
                              <FolderKanban
                                aria-hidden="true"
                                size={15}
                                className="shrink-0"
                              />
                              <span className="truncate">{workspace.name}</span>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          Sin espacios asignados
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {areasUnavailable && (
              <p role="status" className="px-3 py-2 text-xs text-muted-foreground">
                No se pudieron cargar las áreas.
              </p>
            )}
            {areas.length === 0 && !areasUnavailable && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Aún no tienes áreas asignadas.
              </p>
            )}
          </>
        )}

      </nav>

      {/* Administración */}
      {isAdmin && (
        <div className="mt-6">
          {!collapsed && (
            <p className="flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
                ? "bg-primary-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary"
                : "text-foreground hover:bg-surface-hover"
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
          <div className="rounded-xl border border-border/70 bg-surface-hover/70 p-4">
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
