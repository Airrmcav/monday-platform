"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronRight, House } from "lucide-react";

import type { NavigationUser } from "../navigation.types";
import type { WorkspaceNavigationArea } from "../navigation.types";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import type { TaskNotification } from "@/features/task-notifications/schemas/task-notifications.schema";

type AppShellProps = {
  children: ReactNode;
  user: NavigationUser;
  notifications: {
    initialNotifications: TaskNotification[];
    initialUnreadCount: number;
    unavailable: boolean;
  };
  workspaceNavigation: {
    areas: WorkspaceNavigationArea[];
    unavailable: boolean;
  };
};

export default function AppShell({
  children,
  user,
  notifications,
  workspaceNavigation,
}: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const title = getPageTitle(pathname);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-100 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:text-primary"
      >
        Ir al contenido
      </a>

      <Navbar
        user={user}
        notifications={notifications}
        workspaceNavigation={workspaceNavigation}
      />
      <aside
        id="desktop-navigation"
        className={`fixed bottom-0 left-0 top-16 z-30 hidden overflow-y-auto overflow-x-hidden border-r border-border/60 bg-surface transition-[width] duration-300 ease-in-out motion-reduce:transition-none lg:block ${
          sidebarCollapsed ? "w-19" : "w-65"
        }`}
      >
        <Sidebar
          isAdmin={user.isAdmin}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          areas={workspaceNavigation.areas}
          areasUnavailable={workspaceNavigation.unavailable}
        />
      </aside>

      <div
        className={`min-w-0 pt-16 transition-[padding-left] duration-300 ease-in-out motion-reduce:transition-none ${
          sidebarCollapsed ? "lg:pl-19" : "lg:pl-65"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-surface px-4 sm:px-6">
          <nav
            aria-label="Ubicación actual"
            className="flex min-w-0 items-center gap-2.5 text-sm"
          >
            <Link
              href="/dashboard"
              aria-label="Inicio"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <House aria-hidden="true" size={16} />
            </Link>

            <ChevronRight
              aria-hidden="true"
              size={14}
              className="shrink-0 text-muted-foreground"
            />

            <span
              aria-current="page"
              className="truncate font-semibold text-foreground"
            >
              {title}
            </span>
          </nav>
          <span className="hidden text-xs text-muted-foreground sm:block">
            MYCAV Services
          </span>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 p-4 outline-none sm:p-6 lg:px-5"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Inicio";
  if (pathname === "/calendar") return "Calendario";
  if (pathname === "/reports") return "Reportes";
  if (pathname === "/my-work" || pathname.startsWith("/my-work/")) {
    return "Mi trabajo";
  }
  if (pathname === "/users") return "Usuarios";
  if (pathname.startsWith("/users/")) {
    return pathname.endsWith("/edit") ? "Editar usuario" : "Perfil de usuario";
  }
  if (pathname === "/areas" || pathname.startsWith("/areas/")) {
    return "Áreas de trabajo";
  }
  if (pathname.startsWith("/workspaces/")) return "Espacio de trabajo";
  if (pathname.startsWith("/tasks/")) return "Tarea";
  if (pathname === "/workspaces") return "Espacios de trabajo";
  return "MYCAV";
}
