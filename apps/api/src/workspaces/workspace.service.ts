import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserAvatarsService } from '../user-avatars/user-avatars.service.js';
import { getUserTaskSummaries } from '../tasks/user-task-summary.js';
import type { CreateWorkspaceInput } from './schemas/create-workspace.schema.js';
import { UpdateWorkspaceInput } from './schemas/update-workspace.schema.js';

type WorkspaceViewer = {
  id: string;
  isAdmin: boolean;
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatarsService: UserAvatarsService,
  ) {}

  async create(input: CreateWorkspaceInput, createdById: string) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const area = await tx.area.findUnique({
              where: {
                id: input.areaId,
              },
              select: {
                id: true,
                archivedAt: true,
              },
            });

            if (!area) {
              throw new NotFoundException('El área seleccionada no existe.');
            }

            if (area.archivedAt) {
              throw new ConflictException(
                'No puedes crear espacios en un área archivada.',
              );
            }

            const members = await tx.user.findMany({
              where: {
                id: {
                  in: input.memberIds,
                },
                status: 'ACTIVE',
              },
              select: {
                id: true,
              },
            });

            if (members.length !== input.memberIds.length) {
              throw new BadRequestException(
                'Uno o más miembros no existen o están inactivos.',
              );
            }

            return tx.workspace.create({
              data: {
                name: input.name,
                description: input.description ?? null,
                areaId: area.id,
                createdById,
                members: {
                  create: members.map((member) => ({
                    userId: member.id,
                  })),
                },
              },
              select: {
                id: true,
                name: true,
                description: true,
                areaId: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
                archivedAt: true,
                area: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const isTransactionConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isTransactionConflict) {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw new ServiceUnavailableException(
            'Hubo cambios simultáneos. Intenta crear el espacio nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('No se pudo crear el espacio.');
  }

  async findAll(viewer: WorkspaceViewer, areaId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const workspaces = await tx.workspace.findMany({
          where: {
            areaId,
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
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            areaId: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            archivedAt: true,
            area: {
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
                    avatarPath: true,
                  },
                },
              },
            },
          },
        });

        if (workspaces.length === 0) {
          return { data: [] };
        }

        const taskSummaries = await getUserTaskSummaries(
          tx.taskParticipant,
          workspaces.flatMap((workspace) =>
            workspace.members.map((member) => member.user.id),
          ),
        );

        const taskWhere: Prisma.TaskWhereInput = {
          workspaceId: {
            in: workspaces.map((workspace) => workspace.id),
          },
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
        };

        const taskGroups = await tx.task.groupBy({
          by: ['workspaceId', 'status', 'isBlocked'],
          where: taskWhere,
          _count: {
            _all: true,
          },
        });

        const overdueGroups = await tx.task.groupBy({
          by: ['workspaceId'],
          where: {
            ...taskWhere,
            status: {
              not: 'COMPLETED',
            },
            dueAt: {
              lt: new Date(),
            },
          },
          _count: {
            _all: true,
          },
        });

        type TaskStats = {
          taskCount: number;
          completedTaskCount: number;
          overdueTaskCount: number;
          blockedTaskCount: number;
        };

        const statsByWorkspace = new Map<string, TaskStats>();

        for (const workspace of workspaces) {
          statsByWorkspace.set(workspace.id, {
            taskCount: 0,
            completedTaskCount: 0,
            overdueTaskCount: 0,
            blockedTaskCount: 0,
          });
        }

        for (const group of taskGroups) {
          const stats = statsByWorkspace.get(group.workspaceId);

          if (!stats) {
            continue;
          }

          stats.taskCount += group._count._all;

          if (group.status === 'COMPLETED') {
            stats.completedTaskCount += group._count._all;
          } else if (group.isBlocked) {
            stats.blockedTaskCount += group._count._all;
          }
        }

        for (const group of overdueGroups) {
          const stats = statsByWorkspace.get(group.workspaceId);

          if (stats) {
            stats.overdueTaskCount = group._count._all;
          }
        }

        return {
          data: workspaces.map(({ members, ...workspace }) => {
            const stats = statsByWorkspace.get(workspace.id)!;

            return {
              ...workspace,
              members: members.map(({ user }) => ({
                id: user.id,
                name: user.name,
                avatarUrl: this.userAvatarsService.getPublicUrl(user.avatarPath),
                taskSummary: taskSummaries.get(user.id)!,
              })),
              ...stats,
            };
          }),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }

  async findOne(id: string, viewer: WorkspaceViewer) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
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
      },
      select: {
        id: true,
        name: true,
        description: true,
        areaId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!workspace) {
      throw new NotFoundException(
        'El escenario no existe o no está disponible.',
      );
    }
    return workspace;
  }

  async findMembers(id: string, viewer: WorkspaceViewer) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
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
      },
      select: {
        id: true,
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
                email: true,
              },
            },
          },
        },
      },
    });
    if (!workspace) {
      throw new NotFoundException('El espacio no existe o no está disponible.');
    }
    return {
      data: workspace.members.map((member) => member.user),
    };
  }

  async update(
    id: string,
    input: UpdateWorkspaceInput,
    viewer: WorkspaceViewer,
  ) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const currentUser = await tx.user.findUnique({
              where: {
                id: viewer.id,
              },
              select: {
                id: true,
                status: true,
                isAdmin: true,
              },
            });

            if (
              !currentUser ||
              currentUser.status !== 'ACTIVE' ||
              !currentUser.isAdmin
            ) {
              throw new ForbiddenException(
                'Solo un administrador activo puede editar espacios de trabajo.',
              );
            }

            const workspace = await tx.workspace.findFirst({
              where: {
                id,
                archivedAt: null,
                area: {
                  archivedAt: null,
                },
              },
              select: {
                id: true,
                name: true,
                description: true,
                areaId: true,
                updatedAt: true,
                members: {
                  select: {
                    userId: true,
                  },
                },
              },
            });

            if (!workspace) {
              throw new NotFoundException(
                'El espacio no existe o no está disponible.',
              );
            }

            const data: Prisma.WorkspaceUpdateInput = {};

            if (input.name !== undefined && input.name !== workspace.name) {
              data.name = input.name;
            }

            if (
              input.description !== undefined &&
              input.description !== workspace.description
            ) {
              data.description = input.description;
            }

            if (input.memberIds !== undefined) {
              const currentMemberIds = new Set(
                workspace.members.map((member) => member.userId),
              );

              const nextMemberIds = new Set(input.memberIds);

              const addedMemberIds = input.memberIds.filter(
                (userId) => !currentMemberIds.has(userId),
              );

              const removedMemberIds = workspace.members
                .filter((member) => !nextMemberIds.has(member.userId))
                .map((member) => member.userId);

              if (addedMemberIds.length > 0) {
                const activeUsers = await tx.user.findMany({
                  where: {
                    id: {
                      in: addedMemberIds,
                    },
                    status: 'ACTIVE',
                  },
                  select: {
                    id: true,
                  },
                });

                if (activeUsers.length !== addedMemberIds.length) {
                  throw new BadRequestException(
                    'Uno o más usuarios que intentas agregar no existen o están inactivos.',
                  );
                }
              }
              if (removedMemberIds.length > 0) {
                const assignedTask = await tx.task.findFirst({
                  where: {
                    workspaceId: workspace.id,
                    archivedAt: null,
                    participants: {
                      some: {
                        userId: {
                          in: removedMemberIds,
                        },
                      },
                    },
                  },
                  select: {
                    id: true,
                  },
                });

                if (assignedTask) {
                  throw new ConflictException(
                    'No puedes retirar miembros que siguen asignados a tareas o subtareas no archivadas. Reasigna o retira primero sus participaciones.',
                  );
                }
              }

              const membersChanged =
                addedMemberIds.length > 0 || removedMemberIds.length > 0;

              if (membersChanged) {
                data.members = {
                  ...(removedMemberIds.length > 0
                    ? {
                        deleteMany: {
                          userId: {
                            in: removedMemberIds,
                          },
                        },
                      }
                    : {}),

                  ...(addedMemberIds.length > 0
                    ? {
                        create: addedMemberIds.map((userId) => ({
                          userId,
                        })),
                      }
                    : {}),
                };
              }
            }
            if (Object.keys(data).length === 0) {
              return {
                id: workspace.id,
                areaId: workspace.areaId,
                updatedAt: workspace.updatedAt,
              };
            }

            data.updatedAt = new Date();

            return tx.workspace.update({
              where: {
                id: workspace.id,
              },
              data,
              select: {
                id: true,
                areaId: true,
                updatedAt: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const isTransactionConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isTransactionConflict) {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw new ServiceUnavailableException(
            'Hubo cambios simultáneos. Intenta actualizar el espacio nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('No se pudo actualizar el espacio.');
  }

  async findForEdit(id: string, viewer: WorkspaceViewer) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentUser = await this.prisma.user.findUnique({
          where: {
            id: viewer.id,
          },
          select: {
            id: true,
            status: true,
            isAdmin: true,
          },
        });

        if (currentUser?.status !== 'ACTIVE' && currentUser?.isAdmin) {
          throw new ForbiddenException(
            'Solo un administrador activo puede editar espacios de trabajo.',
          );
        }

        const workspace = await this.prisma.workspace.findFirst({
          where: {
            id,
            archivedAt: null,
            area: {
              archivedAt: null,
            },
          },
          select: {
            id: true,
            name: true,
            description: true,
            areaId: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            archivedAt: true,
            area: {
              select: {
                id: true,
                name: true,
              },
            },
            members: {
              orderBy: {
                userId: 'asc',
              },
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!workspace) {
          throw new NotFoundException(
            'El espacio no existe o no está disponible.',
          );
        }

        const { members, ...workspaceData } = workspace;
        return {
          ...workspaceData,
          members: members.map((member) => member.user),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }
}
