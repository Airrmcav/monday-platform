"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ChevronRight,
  House,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import type { NavigationUser } from "../navigation.types";
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
};

export default function AppShell({
  children,
  user,
  notifications,
}: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const title =
    pathname === "/dashboard"
      ? "Inicio"
      : pathname === "/users" || pathname.startsWith("/users/")
        ? "Usuarios"
        : "MYCAV";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-100 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:text-primary"
      >
        Ir al contenido
      </a>

      <Navbar user={user} notifications={notifications} />
      <aside
        id="desktop-navigation"
        className={`fixed bottom-0 left-0 top-16 z-30 hidden overflow-y-auto overflow-x-hidden border-r border-border/60 bg-surface transition-[width] duration-300 ease-in-out motion-reduce:transition-none lg:block ${
          sidebarCollapsed ? "w-19" : "w-65"
        }`}
      >
        <Sidebar isAdmin={user.isAdmin} collapsed={sidebarCollapsed} />
      </aside>

      <div
        className={`min-w-0 pt-16 transition-[padding-left] duration-300 ease-in-out motion-reduce:transition-none ${
          sidebarCollapsed ? "lg:pl-19" : "lg:pl-65"
        }`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-border/60 bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={
              sidebarCollapsed
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
            aria-expanded={!sidebarCollapsed}
            aria-controls="desktop-navigation"
            className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-ring lg:flex"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" size={19} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={19} />
            )}
          </button>

          <nav
            aria-label="Ubicación actual"
            className="flex min-w-0 items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard"
              aria-label="Inicio"
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <House aria-hidden="true" size={17} />
            </Link>

            <ChevronRight
              aria-hidden="true"
              size={15}
              className="shrink-0 text-muted-foreground"
            />

            <span aria-current="page" className="truncate font-medium">
              {title}
            </span>
          </nav>
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
