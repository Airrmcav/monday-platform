import { Flag } from "lucide-react";
import { TaskPriority } from "../schemas/tasks.schema";

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
};

const priorityStyles: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Baja",
    className: "bg-pending-soft text-pending",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-primary-soft text-primary",
  },
  HIGH: {
    label: "Alta",
    className: "bg-progress-soft text-progress",
  },
  URGENT: {
    label: "Urgente",
    className: "bg-danger-soft text-danger",
  },
};

export default function TaskPriorityBadge({
  priority,
}: TaskPriorityBadgeProps) {
  const style = priorityStyles[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold ${style.className}`}
    >
      <Flag aria-hidden="true" size={13} />

      <span className="sr-only">Prioridad: </span>
      {style.label}
    </span>
  );
}
