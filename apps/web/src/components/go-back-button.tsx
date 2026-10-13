"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GoBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft aria-hidden="true" size={17} />
      Volver
    </button>
  );
}
