import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

type DashboardViewer = {
  id: string;
  isAdmin: boolean;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(viewer: DashboardViewer) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: viewer.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        isAdmin: true,
      },
    });

    if (!currentUser || currentUser.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No tienes acceso activo a esta plataforma.',
      );
    }

    const now = new Date();
    const nextSevenDays = new Date(now);
    nextSevenDays.setDate(nextSevenDays.getDate() + 7);

    const workspaceWhere = {
      archivedAt: null,
      area: {
        archivedAt: null,
      },
      ...(currentUser.isAdmin
        ? {}
        : {
            members: {
              some: {
                userId: currentUser.id,
              },
            },
          }),
    };

    const taskWhere = {
      parentId: null,
      archivedAt: null,
      workspace: workspaceWhere,
      ...(currentUser.isAdmin
        ? {}
        : {
            participants: {
              some: {
                userId: currentUser.id,
              },
            },
          }),
    };

    const [
      activeWorkspaces,
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      dueNextSevenDays,
      urgentTasks,
      statusCounts,
      priorityCounts,
      attentionTasks,
      upcomingTasks,
      recentActivity,
    ] = await Promise.all([
      this.prisma.workspace.count({
        where: workspaceWhere,
      }),

      this.prisma.task.count({
        where: taskWhere,
      }),

      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
        },
      }),

      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: 'COMPLETED',
        },
      }),

      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
          dueAt: {
            lt: now,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
          dueAt: {
            gte: now,
            lt: nextSevenDays,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
          priority: {
            in: ['HIGH', 'URGENT'],
          },
        },
      }),

      this.prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: {
          _all: true,
        },
      }),

      this.prisma.task.groupBy({
        by: ['priority'],
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
          OR: [
            {
              dueAt: {
                lt: now,
              },
            },
            {
              priority: {
                in: ['HIGH', 'URGENT'],
              },
            },
            {
              dueAt: {
                gte: now,
                lt: nextSevenDays,
              },
            },
          ],
        },
        orderBy: [
          {
            dueAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          dueAt: true,
          priority: true,
          status: true,
          workspace: {
            select: {
              id: true,
              name: true,
              area: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          status: {
            not: 'COMPLETED',
          },
          dueAt: {
            gte: now,
            lt: nextSevenDays,
          },
        },
        orderBy: [
          {
            dueAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          dueAt: true,
          priority: true,
          status: true,
          workspace: {
            select: {
              id: true,
              name: true,
              area: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.taskHistoryEntry.findMany({
        where: {
          task: taskWhere,
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        take: 6,
        select: {
          id: true,
          action: true,
          actorName: true,
          createdAt: true,
          task: {
            select: {
              id: true,
              title: true,
              workspace: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const tasksByStatus = {
      PENDING: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      COMPLETED: 0,
    };

    for (const item of statusCounts) {
      tasksByStatus[item.status] = item._count._all;
    }

    const tasksByPriority = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      URGENT: 0,
    };

    for (const item of priorityCounts) {
      tasksByPriority[item.priority] = item._count._all;
    }

    return {
      viewer: {
        name: currentUser.name,
        isAdmin: currentUser.isAdmin,
      },

      metrics: {
        activeWorkspaces,
        totalTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
        dueNextSevenDays,
        urgentTasks,
        completionRate:
          totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100),
      },

      tasksByStatus,
      tasksByPriority,
      attentionTasks,
      upcomingTasks,
      recentActivity,
    };
  }
}
