import Image from "next/image";
import Link from "next/link";

import type { NavigationUser } from "../navigation.types";
import MobileNavigation from "./mobile-navigation";
import NotificationsPanel from "./notifications-panel";
import UserMenu from "./user-menu";
import type { TaskNotification } from "@/features/task-notifications/schemas/task-notifications.schema";
import type { WorkspaceNavigationArea } from "../navigation.types";

type NavbarProps = {
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

export default function Navbar({
  user,
  notifications,
  workspaceNavigation,
}: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-surface px-3 text-foreground shadow-[0_1px_4px_rgb(50_51_56/5%)] sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-13">
        <MobileNavigation
          isAdmin={user.isAdmin}
          areas={workspaceNavigation.areas}
          areasUnavailable={workspaceNavigation.unavailable}
        />

        <Link
          href="/dashboard"
          aria-label="MYCAV Services — Inicio"
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface p-1.5 shadow-sm">
            <Image
              src="/Icon.webp"
              alt="Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </span>

          <span className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
            MYCAV<span className="text-primary">.</span>
            <span className="hidden font-medium text-muted-foreground sm:inline">
              {" "}
              Services
            </span>
          </span>
        </Link>

        <span
          aria-hidden="true"
          className="hidden h-7 w-px bg-border md:block"
        />

        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-medium text-foreground">
            Gestión de trabajo
          </p>
          <p className="text-[11px] text-muted-foreground">
            Espacio de trabajo
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationsPanel {...notifications} />

        <span aria-hidden="true" className="mx-1 h-7 w-px bg-border sm:mx-2" />

        <UserMenu user={user} />
      </div>
    </header>
  );
}
