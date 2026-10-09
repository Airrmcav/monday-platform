import type { Prisma } from '../generated/prisma/client.js';

export type UserTaskSummary = {
  openTaskCount: number;
  overdueTaskCount: number;
};

export async function getUserTaskSummaries(
  taskParticipants: Prisma.TransactionClient['taskParticipant'],
  userIds: string[],
  now = new Date(),
) {
  const uniqueUserIds = [...new Set(userIds)];
  const summaries = new Map<string, UserTaskSummary>(
    uniqueUserIds.map((userId) => [
      userId,
      { openTaskCount: 0, overdueTaskCount: 0 },
    ]),
  );

  if (uniqueUserIds.length === 0) {
    return summaries;
  }

  const [openTaskGroups, overdueTaskGroups] = await Promise.all([
    taskParticipants.groupBy({
      by: ['userId'],
      where: {
        userId: { in: uniqueUserIds },
        task: {
          is: {
            archivedAt: null,
            status: { not: 'COMPLETED' },
          },
        },
      },
      _count: { _all: true },
    }),
    taskParticipants.groupBy({
      by: ['userId'],
      where: {
        userId: { in: uniqueUserIds },
        task: {
          is: {
            archivedAt: null,
            status: { not: 'COMPLETED' },
            dueAt: { lt: now },
          },
        },
      },
      _count: { _all: true },
    }),
  ]);

  for (const { userId, _count } of openTaskGroups) {
    const summary = summaries.get(userId);

    if (summary) {
      summary.openTaskCount = _count._all;
    }
  }

  for (const { userId, _count } of overdueTaskGroups) {
    const summary = summaries.get(userId);

    if (summary) {
      summary.overdueTaskCount = _count._all;
    }
  }

  return summaries;
}
