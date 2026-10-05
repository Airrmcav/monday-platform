"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";

import LogoutButton from "@/features/auth/components/logout-button";
import UserAvatar from "@/features/users/components/user-avatar";
import type { NavigationUser } from "../navigation.types";

type UserMenuProps = {
  user: NavigationUser;
};

export default function UserMenu({ user }: UserMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        menuRef.current?.open &&
        !menuRef.current.contains(event.target)
      ) {
        menuRef.current.removeAttribute("open");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.removeAttribute("open");
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details ref={menuRef} className="relative">
      <summary
        ref={triggerRef}
        aria-label={`Abrir cuenta de ${user.name}`}
        className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <UserAvatar
          userId={user.id}
          name={user.name}
          avatarUrl={user.avatarUrl}
          className="h-9 w-9 border-2 border-border bg-primary-soft text-xs font-bold text-primary"
        />

        <ChevronDown
          aria-hidden="true"
          size={15}
          className="hidden text-muted-foreground sm:block"
        />
      </summary>

      <div className="absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-xl">
        <div className="h-1 bg-primary" />

        <div className="border-b border-border/60 p-5">
          <p className="wrap-break-word font-semibold">{user.name}</p>

          <p className="mt-1 break-all text-xs text-muted-foreground">
            {user.email}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
            <ShieldCheck aria-hidden="true" size={14} />
            {user.isAdmin ? "Administrador" : "Empleado"}
          </span>
        </div>

        <div className="p-4">
          <LogoutButton />
        </div>
      </div>
    </details>
  );
}
