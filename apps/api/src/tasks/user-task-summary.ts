import type { Prisma } from '../generated/prisma/client.js';

export type UserTaskSummary = {
  openTaskCount: number;
  overdueTaskCount: number;
};

export type UserTasksByStatus = {
  PENDING: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  COMPLETED: number;
};

export async function getUserTasksByStatus(
  taskParticipants: Prisma.TransactionClient['taskParticipant'],
  userIds: string[],
) {
  const uniqueUserIds = [...new Set(userIds)];
  const summaries = new Map<string, UserTasksByStatus>(
    uniqueUserIds.map((userId) => [
      userId,
      {
        PENDING: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        COMPLETED: 0,
      },
    ]),
  );

  if (uniqueUserIds.length === 0) {
    return summaries;
  }

  const statuses = [
    'PENDING',
    'IN_PROGRESS',
    'IN_REVIEW',
    'COMPLETED',
  ] as const;
  const statusGroups = await Promise.all(
    statuses.map((status) =>
      taskParticipants.groupBy({
        by: ['userId'],
        where: {
          userId: { in: uniqueUserIds },
          task: {
            is: {
              archivedAt: null,
              status,
            },
          },
        },
        _count: { _all: true },
      }),
    ),
  );

  for (const [index, groups] of statusGroups.entries()) {
    const status = statuses[index];

    for (const { userId, _count } of groups) {
      const summary = summaries.get(userId);

      if (summary) {
        summary[status] = _count._all;
      }
    }
  }

  return summaries;
}

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
