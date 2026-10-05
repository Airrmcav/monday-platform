import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type ReportsViewer = {
  id: string;
  isAdmin: boolean;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReportData(viewer: ReportsViewer) {
    const areaWhere: Prisma.AreaWhereInput = {
      archivedAt: null,
      ...(viewer.isAdmin
        ? {}
        : {
            workspaces: {
              some: {
                archivedAt: null,
                members: {
                  some: {
                    userId: viewer.id,
                  },
                },
              },
            },
          }),
    };

    const workspaceWhere: Prisma.WorkspaceWhereInput = {
      archivedAt: null,
      area: {
        archivedAt: null,
      },
      ...(viewer.isAdmin
        ? {}
        : {
            members: {
              some: {
                userId: viewer.id,
              },
            },
          }),
    };

    const taskWhere: Prisma.TaskWhereInput = {
      archivedAt: null,
      workspace: workspaceWhere,
      ...(viewer.isAdmin
        ? {}
        : {
            participants: {
              some: {
                userId: viewer.id,
              },
            },
          }),
      OR: [
        {
          parentId: null,
        },
        {
          parent: {
            is: {
              parentId: null,
              archivedAt: null,
              ...(viewer.isAdmin
                ? {}
                : {
                    participants: {
                      some: {
                        userId: viewer.id,
                      },
                    },
                  }),
            },
          },
        },
      ],
    };

    const [areas, workspaces, tasks] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where: areaWhere,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.workspace.findMany({
        where: workspaceWhere,
        orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          areaId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            where: {
              user: {
                status: 'ACTIVE',
              },
            },
            orderBy: {
              userId: 'asc',
            },
            select: {
              user: {
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
        where: taskWhere,
        orderBy: [
          { workspace: { area: { name: 'asc' } } },
          { workspace: { name: 'asc' } },
          { dueAt: 'asc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          workspaceId: true,
          parentId: true,
          createdById: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startsAt: true,
          dueAt: true,
          completedAt: true,
          isBlocked: true,
          blockedReason: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
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
          participants: {
            orderBy: [{ role: 'asc' }, { userId: 'asc' }],
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          comments: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              authorName: true,
              content: true,
              createdAt: true,
            },
          },
          history: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              action: true,
              actorName: true,
              changes: true,
              schemaVersion: true,
              createdAt: true,
            },
          },
          attachments: {
            where: {
              status: 'ATTACHED',
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              originalName: true,
              contentType: true,
              sizeBytes: true,
              uploadedByName: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      generatedAt: new Date(),
      areas,
      workspaces: workspaces.map(({ members, ...workspace }) => ({
        ...workspace,
        members: members.map(({ user }) => user),
      })),
      tasks: tasks.map(({ participants, ...task }) => ({
        ...task,
        participants: participants.map(({ role, user }) => ({
          ...user,
          role,
        })),
      })),
    };
  }
}
