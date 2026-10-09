import Link from "next/link";
import type { UserTaskSummary } from "../schemas/users.schemas";

export const USER_TASK_HEALTH_THRESHOLDS = {
  open: 5,
  overdue: 3,
} as const;

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className: string;
  userId?: string;
  taskSummary?: UserTaskSummary | null;
};

export function getUserTaskHealth(taskSummary?: UserTaskSummary | null) {
  if (!taskSummary) {
    return {
      color: "var(--color-muted-foreground)",
      description: "No se pudo cargar el estado de las tareas",
    };
  }

  if (taskSummary.overdueTaskCount >= USER_TASK_HEALTH_THRESHOLDS.overdue) {
    return {
      color: "var(--color-danger)",
      description: `${taskSummary.overdueTaskCount} tareas vencidas`,
    };
  }

  if (
    taskSummary.openTaskCount >= USER_TASK_HEALTH_THRESHOLDS.open ||
    taskSummary.overdueTaskCount > 0
  ) {
    return {
      color: "var(--color-progress)",
      description: `${taskSummary.openTaskCount} tareas abiertas, ${taskSummary.overdueTaskCount} vencidas`,
    };
  }

  return {
    color: "var(--color-success)",
    description: `${taskSummary.openTaskCount} tareas abiertas, ${taskSummary.overdueTaskCount} vencidas`,
  };
}

export default function UserAvatar({
  name,
  avatarUrl,
  className,
  userId,
  taskSummary,
}: UserAvatarProps) {
  const taskHealth = getUserTaskHealth(taskSummary);
  const avatarLabel = `Foto de ${name}. Estado de tareas: ${taskHealth.description}.`;

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("es-MX") || "?";

  const avatar = (
    <span
      role="img"
      aria-label={avatarLabel}
      title={taskHealth.description}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${className}`}
      style={{ borderColor: taskHealth.color }}
    >
      <span aria-hidden="true">{initials}</span>
      {avatarUrl && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      )}
    </span>
  );

  if (!userId) {
    return avatar;
  }

  return (
    <Link
      href={`/users/${encodeURIComponent(userId)}`}
      aria-label={`Ver perfil de ${name}. Estado de tareas: ${taskHealth.description}.`}
      title={taskHealth.description}
      className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {avatar}
    </Link>
  );
}
