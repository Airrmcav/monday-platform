import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";

export const dueDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export function getPriorityPresentation(
  priority: DashboardSummary["attentionTasks"][number]["priority"],
) {
  switch (priority) {
    case "URGENT":
      return {
        label: "Urgente",
        color: "#b4233f",
        softColor: "#ffedf1",
      };

    case "HIGH":
      return {
        label: "Alta",
        color: "#a86400",
        softColor: "#fff4dc",
      };

    case "LOW":
      return {
        label: "Baja",
        color: "#1769c2",
        softColor: "#eaf2ff",
      };

    default:
      return {
        label: "Normal",
        color: "#5f6470",
        softColor: "#f1f3f7",
      };
  }
}
