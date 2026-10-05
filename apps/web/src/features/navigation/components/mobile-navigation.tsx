"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import Sidebar from "./sidebar";

type MobileNavigationProps = {
  isAdmin: boolean;
};

export default function MobileNavigation({ isAdmin }: MobileNavigationProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");

    function handleResize() {
      if (desktop.matches) dialogRef.current?.close();
    }

    desktop.addEventListener("change", handleResize);

    return () => {
      desktop.removeEventListener("change", handleResize);
    };
  }, []);

  const buttonClasses =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
    "text-white/85 transition-colors hover:bg-white/10 hover:text-white " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-brand-accent";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Abrir navegación"
        aria-haspopup="dialog"
        aria-controls="mobile-navigation"
        className={`${buttonClasses} lg:hidden`}
      >
        <Menu aria-hidden="true" size={21} />
      </button>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="Navegación principal"
        onClose={() => {
          if (window.matchMedia("(max-width: 1023px)").matches) {
            triggerRef.current?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(320px,88vw)] max-w-none border-0 bg-surface p-0 text-foreground shadow-xl backdrop:bg-brand-navy/40"
      >
        <div className="flex items-center justify-between bg-brand-navy bg-(image:--brand-gradient) px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 p-1.5">
              <Image
                src="/Icon.webp"
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </span>

            <span className="text-sm font-semibold tracking-wide">
              MYCAV Services
            </span>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Cerrar navegación"
            className={buttonClasses}
          >
            <X aria-hidden="true" size={21} />
          </button>
        </div>

        <Sidebar isAdmin={isAdmin} onNavigate={closeMenu} />
      </dialog>
    </>
  );
}
