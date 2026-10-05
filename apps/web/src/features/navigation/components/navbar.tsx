import Image from "next/image";
import Link from "next/link";

import type { NavigationUser } from "../navigation.types";
import MobileNavigation from "./mobile-navigation";
import NotificationsPanel from "./notifications-panel";
import UserMenu from "./user-menu";
import { getTaskNotifications } from "@/features/task-notifications/task-notifications.service";
import { TaskNotification } from "@/features/task-notifications/schemas/task-notifications.schema";

type NavbarProps = {
  user: NavigationUser;
  notifications: {
    initialNotifications: TaskNotification[];
    initialUnreadCount: number;
    unavailable: boolean;
  };
};

export default function Navbar({ user, notifications }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-brand-navy bg-(image:--brand-gradient) px-3 text-white shadow-sm sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <MobileNavigation isAdmin={user.isAdmin} />

        <Link
          href="/dashboard"
          aria-label="MYCAV Services — Inicio"
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5">
            <Image
              src="/Icon.webp"
              alt="Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </span>

          <span className="truncate text-base font-bold tracking-wide sm:text-lg">
            MYCAV
            <span className="hidden sm:inline"> Services</span>
          </span>
        </Link>

        <span
          aria-hidden="true"
          className="hidden h-6 w-px bg-white/20 md:block"
        />

        <span className="hidden text-sm text-white/75 md:block">
          Gestión de trabajo
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <NotificationsPanel {...notifications} />

        <span aria-hidden="true" className="mx-1 h-7 w-px bg-white/20" />

        <UserMenu user={user} />
      </div>
    </header>
  );
}
