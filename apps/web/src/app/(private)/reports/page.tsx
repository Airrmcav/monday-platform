import { redirect } from "next/navigation";

import ReportsContent from "@/features/reports/components/reports-content";
import { getReportsData } from "@/features/reports/reports.service";

export default async function ReportsPage() {
  const result = await getReportsData();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status !== "success") {
    return (
      <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-2xl border border-border/70 bg-surface p-8 text-center shadow-(--shadow-panel)">
        <div>
          <h1 className="text-xl font-semibold">
            {result.status === "forbidden"
              ? "No tienes acceso a los reportes"
              : "No pudimos cargar los reportes"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.status === "forbidden"
              ? "Contacta al administrador de la plataforma para recuperar tu acceso."
              : "Intenta recargar la página en unos momentos."}
          </p>
        </div>
      </div>
    );
  }

  return <ReportsContent data={result.data} />;
}
