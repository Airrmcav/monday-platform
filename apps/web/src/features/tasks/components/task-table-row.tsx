"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type TaskTableRowProps = {
  href: string;
  children: ReactNode;
};

export default function TaskTableRow({ href, children }: TaskTableRowProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest("a, button, input, select, textarea, [role='button']")) {
      return;
    }

    if (window.getSelection()?.toString()) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(href);
  }

  return (
    <tr
      onClick={handleClick}
      className="group cursor-pointer transition-colors hover:bg-primary-soft/30 focus-within:bg-primary-soft/30"
    >
      {children}
    </tr>
  );
}
