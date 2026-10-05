import { redirect } from "next/navigation";

import MyWorkPage from "@/features/dashboard/components/my-work-content";
import { getMyWorkSummary } from "@/features/dashboard/dashboard.service";

type MyWorkRouteProps = {
  searchParams: Promise<{
    focus?: string | string[];
  }>;
};

export default async function MyWorkRoute({ searchParams }: MyWorkRouteProps) {
  const query = await searchParams;
  const requestedFocus = Array.isArray(query.focus) ? query.focus[0] : query.focus;
  const focus =
    requestedFocus === "overdue" || requestedFocus === "upcoming"
      ? requestedFocus
      : "all";
  const myWorkResult = await getMyWorkSummary(focus);

  if (myWorkResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (myWorkResult.status === "forbidden") {
    return (
      <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-2xl border border-border/70 bg-surface p-8 text-center shadow-(--shadow-panel)">
        <div>
          <h1 className="text-xl font-semibold">No tienes acceso activo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contacta al administrador de la plataforma para recuperar tu acceso.
          </p>
        </div>
      </div>
    );
  }

  if (myWorkResult.status === "unavailable") {
    return (
      <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-2xl border border-border/70 bg-surface p-8 text-center shadow-(--shadow-panel)">
        <div>
          <h1 className="text-xl font-semibold">No pudimos cargar tu trabajo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta recargar la página en unos momentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MyWorkPage
      data={myWorkResult.result}
      focus={focus}
    />
  );
}
