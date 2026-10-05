import type { TaskNotification } from "./schemas/task-notifications.schema";

export type TaskNotificationGroup = {
  taskId: string;
  taskTitle: string;
  workspaceName: string;
  items: TaskNotification[];
  unreadCount: number;
  latestAt: string;
};

export function groupNotificationsByTask(
  notifications: TaskNotification[],
): TaskNotificationGroup[] {
  const groups = new Map<string, TaskNotificationGroup>();

  for (const notification of notifications) {
    const existing = groups.get(notification.task.id);

    if (existing) {
      existing.items.push(notification);
      if (notification.readAt === null) existing.unreadCount += 1;
      if (notification.createdAt > existing.latestAt) {
        existing.latestAt = notification.createdAt;
      }
      continue;
    }

    groups.set(notification.task.id, {
      taskId: notification.task.id,
      taskTitle: notification.task.title,
      workspaceName: notification.task.workspace.name,
      items: [notification],
      unreadCount: notification.readAt === null ? 1 : 0,
      latestAt: notification.createdAt,
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    }))
    .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}
