import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskInput } from './schemas/create-task.schema.js';
import { Prisma } from '../generated/prisma/client.js';
import { UpdateTaskStatusInput } from './schemas/update-task-status.schema.js';
import { UpdateTaskBlockInput } from './schemas/update-task-block.schema.js';
import { UpdateTaskInput } from './schemas/update-task.schema.js';
import { TaskHistoryQuery } from './schemas/task-history-query.schema.js';
import { TaskNotificationsService } from '../task-notification/task-notifications.service.js';
import { UserAvatarsService } from '../user-avatars/user-avatars.service.js';

type TaskViewer = {
  id: string;
  isAdmin: boolean;
};

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  COMPLETED: 'Completada',
};

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskNotificationsService: TaskNotificationsService,
    private readonly userAvatarsService: UserAvatarsService,
  ) {}

  private getAccessibleTaskWhere(viewer: TaskViewer): Prisma.TaskWhereInput {
    return {
      archivedAt: null,
      workspace: {
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
          parent: null,
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
  }

  private getNotificationRecipientIds(
    userIds: string[],
    actorId: string,
  ): string[] {
    return [...new Set(userIds)].filter((userId) => userId !== actorId);
  }

  async create(input: CreateTaskInput, createdById: string) {
    const maxAttemps = 3;

    for (let attempt = 1; attempt <= maxAttemps; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const creator = await tx.user.findUnique({
              where: {
                id: createdById,
              },
              select: {
                id: true,
                name: true,
                status: true,
                isAdmin: true,
              },
            });
            if (!creator || creator.status !== 'ACTIVE') {
              throw new ForbiddenException(
                'No tienes acceso activo a esta plataforma.',
              );
            }
            const workspace = await tx.workspace.findFirst({
              where: {
                id: input.workspaceId,
                archivedAt: null,
                area: {
                  archivedAt: null,
                },
                ...(creator.isAdmin
                  ? {}
                  : {
                      members: {
                        some: {
                          userId: creator.id,
                        },
                      },
                    }),
              },
              select: {
                id: true,
              },
            });

            if (!workspace) {
              throw new NotFoundException(
                'El espacio no existe o no está disponible.',
              );
            }

            const participantIds = [
              ...input.responsibleIds,
              ...input.collaboratorIds,
            ];

            if (input.parentId !== undefined) {
              const parentTask = await tx.task.findFirst({
                where: {
                  id: input.parentId,
                  workspaceId: workspace.id,
                  parentId: null,
                  archivedAt: null,
                  ...(creator.isAdmin
                    ? {}
                    : {
                        participants: {
                          some: {
                            userId: creator.id,
                          },
                        },
                      }),
                },
                select: {
                  id: true,
                  status: true,
                  participants: {
                    select: {
                      userId: true,
                    },
                  },
                },
              });

              if (!parentTask) {
                throw new NotFoundException(
                  'La tarea principal no existe o no está disponible.',
                );
              }

              if (parentTask.status === 'COMPLETED') {
                throw new BadRequestException(
                  'Un administrador debe reabrir la tarea principal antes de agregar subtareas.',
                );
              }
              const parentParticipantIds = new Set(
                parentTask.participants.map(
                  (participant) => participant.userId,
                ),
              );
              const hasParticipantsOutsideParent = participantIds.some(
                (userId) => !parentParticipantIds.has(userId),
              );

              if (hasParticipantsOutsideParent) {
                throw new BadRequestException(
                  'Los responsables y colaboradores de la subtarea deben participar en la tarea principal.',
                );
              }
            }

            const members = await tx.workspaceMember.findMany({
              where: {
                workspaceId: workspace.id,
                userId: {
                  in: participantIds,
                },
                user: {
                  status: 'ACTIVE',
                },
              },
              select: {
                userId: true,
              },
            });

            if (members.length !== participantIds.length) {
              throw new BadRequestException(
                'Todos los participantes deben ser miembros activos del espacio.',
              );
            }

            const startsAt = new Date();
            const dueAt = new Date(input.dueAt);

            if (dueAt < startsAt) {
              throw new BadRequestException(
                'La fecha de entrega no puede ser anterior al registro de la tarea.',
              );
            }

            const task = await tx.task.create({
              data: {
                workspaceId: workspace.id,
                parentId: input.parentId ?? null,
                createdById: creator.id,
                title: input.title,
                description: input.description ?? null,
                priority: input.priority,
                startsAt,
                dueAt,
                createdAt: startsAt,
                status: 'PENDING',
                isBlocked: false,
                participants: {
                  create: [
                    ...input.responsibleIds.map((userId) => ({
                      userId,
                      role: 'RESPONSIBLE' as const,
                    })),
                    ...input.collaboratorIds.map((userId) => ({
                      userId,
                      role: 'COLLABORATOR' as const,
                    })),
                  ],
                },
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                createdById: true,
                title: true,
                description: true,
                priority: true,
                status: true,
                startsAt: true,
                dueAt: true,
                completedAt: true,
                isBlocked: true,
                blockedReason: true,
                createdAt: true,
                updatedAt: true,
                archivedAt: true,
                participants: {
                  orderBy: {
                    userId: 'desc',
                  },
                  select: {
                    userId: true,
                    role: true,
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

            await tx.taskHistoryEntry.create({
              data: {
                taskId: task.id,
                actorId: creator.id,
                actorName: creator.name,
                action: 'CREATED',
                schemaVersion: 1,
                createdAt: task.createdAt,
                changes: {
                  title: {
                    before: null,
                    after: task.title,
                  },
                  description: {
                    before: null,
                    after: task.description,
                  },
                  priority: {
                    before: null,
                    after: task.priority,
                  },
                  status: {
                    before: null,
                    after: task.status,
                  },
                  startsAt: {
                    before: null,
                    after: task.startsAt?.toISOString() ?? null,
                  },
                  dueAt: {
                    before: null,
                    after: task.dueAt.toISOString(),
                  },
                  participants: {
                    before: [],
                    after: task.participants.map((participant) => ({
                      userId: participant.userId,
                      name: participant.user.name,
                      role: participant.role,
                    })),
                  },
                },
              },
            });

            await this.taskNotificationsService.createForRecipients(tx, {
              recipientIds: task.participants.map(
                (participant) => participant.userId,
              ),
              taskId: task.id,
              actorId: creator.id,
              actorName: creator.name,
              type: 'TASK_ASSIGNED',
              title: input.parentId
                ? 'Te asignaron una subtarea'
                : 'Te asignaron una tarea',
              body: `${creator.name} te asignó: ${task.title}`,
            });

            return this.withParticipantAvatarUrls(task);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const isTransactionConflic =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isTransactionConflic) {
          throw error;
        }

        if (attempt === maxAttemps) {
          throw new ServiceUnavailableException(
            'Hubo cambios simultáneos. Intenta crear la tarea nuevamente.',
          );
        }
      }
    }
    throw new ServiceUnavailableException('No se pudo crear la tarea.');
  }

  async findAll(workspaceId: string, viewer: TaskViewer) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
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
        tasks: {
          where: {
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
          orderBy: [{ dueAt: 'asc' }, { id: 'desc' }],
          select: {
            id: true,
            workspaceId: true,
            parentId: true,
            createdById: true,
            title: true,
            description: true,
            priority: true,
            status: true,
            startsAt: true,
            dueAt: true,
            completedAt: true,
            isBlocked: true,
            blockedReason: true,
            createdAt: true,
            updatedAt: true,
            archivedAt: true,
            participants: {
              orderBy: {
                userId: 'asc',
              },
              select: {
                userId: true,
                role: true,
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
        },
      },
    });
    if (!workspace) {
      throw new NotFoundException('El espacio no existe o no está disponible.');
    }

    return {
      data: workspace.tasks.map((task) =>
        this.withParticipantAvatarUrls(task),
      ),
    };
  }

  async findCalendarTasks(viewer: TaskViewer) {
    const tasks = await this.prisma.task.findMany({
      where: this.getAccessibleTaskWhere(viewer),
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        parentId: true,
        title: true,
        status: true,
        priority: true,
        dueAt: true,
        isBlocked: true,
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
      },
    });

    return { data: tasks };
  }

  async findOne(id: string, viewer: TaskViewer) {
    const task = await this.prisma.task.findFirst({
      where: {
        ...this.getAccessibleTaskWhere(viewer),
        id,
      },
      select: {
        id: true,
        workspaceId: true,
        parentId: true,
        createdById: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        startsAt: true,
        dueAt: true,
        completedAt: true,
        isBlocked: true,
        blockedReason: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
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
          orderBy: {
            userId: 'asc',
          },
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarPath: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('La tarea no existe o no está disponible.');
    }
    return this.withParticipantAvatarUrls(task);
  }

  async updateStatusTask(
    id: string,
    input: UpdateTaskStatusInput,
    viewer: TaskViewer,
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

            const task = await tx.task.findFirst({
              where: {
                ...this.getAccessibleTaskWhere(currentUser),
                id,
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                title: true,
                status: true,
                completedAt: true,
                updatedAt: true,
                parent: {
                  select: {
                    status: true,
                  },
                },
                participants: {
                  select: {
                    userId: true,
                  },
                },
              },
            });

            if (!task) {
              throw new NotFoundException(
                'La tarea no existe o no está disponible.',
              );
            }

            if (!currentUser.isAdmin) {
              if (task.status === 'COMPLETED') {
                throw new ForbiddenException(
                  'Solo un administrador puede modificar el estado de una tarea completada.',
                );
              }

              if (input.status === 'COMPLETED') {
                throw new ForbiddenException(
                  'Solo un administrador puede completar una tarea.',
                );
              }
            }

            if (task.status === input.status) {
              return {
                id: task.id,
                workspaceId: task.workspaceId,
                status: task.status,
                completedAt: task.completedAt,
                updatedAt: task.updatedAt,
              };
            }

            if (task.parent?.status === 'COMPLETED') {
              throw new BadRequestException(
                'Un administrador debe reabrir la tarea principal antes de cambiar el estado de esta subtarea.',
              );
            }

            if (input.status === 'COMPLETED' && task.parentId === null) {
              const unfinishedSubtasks = await tx.task.count({
                where: {
                  parentId: task.id,
                  archivedAt: null,
                  status: {
                    not: 'COMPLETED',
                  },
                },
              });

              if (unfinishedSubtasks > 0) {
                throw new BadRequestException(
                  'No puedes completar la tarea principal mientras tenga subtareas sin terminar.',
                );
              }
            }

            const updatedTask = await tx.task.update({
              where: {
                id: task.id,
              },
              data: {
                status: input.status,
                completedAt: input.status === 'COMPLETED' ? new Date() : null,
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                status: true,
                completedAt: true,
                updatedAt: true,
              },
            });

            await tx.taskHistoryEntry.create({
              data: {
                taskId: task.id,
                actorId: currentUser.id,
                actorName: currentUser.name,
                action: 'STATUS_CHANGED',
                schemaVersion: 1,
                createdAt: updatedTask.updatedAt,
                changes: {
                  status: {
                    before: task.status,
                    after: updatedTask.status,
                  },
                  completedAt: {
                    before: task.completedAt?.toISOString() ?? null,
                    after: updatedTask.completedAt?.toISOString() ?? null,
                  },
                },
              },
            });

            const recipientIds = this.getNotificationRecipientIds(
              task.participants.map((participant) => participant.userId),
              currentUser.id,
            );

            if (recipientIds.length > 0) {
              const statusLabel =
                TASK_STATUS_LABELS[updatedTask.status] ?? updatedTask.status;

              await this.taskNotificationsService.createForRecipients(tx, {
                recipientIds,
                taskId: task.id,
                actorId: currentUser.id,
                actorName: currentUser.name,
                type: 'TASK_STATUS_CHANGED',
                title:
                  updatedTask.status === 'COMPLETED'
                    ? 'Una tarea fue completada'
                    : 'Cambió el estado de una tarea',
                body: `${currentUser.name} cambió "${task.title}" a ${statusLabel}`,
              });
            }

            return updatedTask;
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
            'Hubo cambios simultáneos. Intenta actualizar el estado nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'No se pudo actualizar el estado de la tarea.',
    );
  }

  async updateBlockTask(
    id: string,
    input: UpdateTaskBlockInput,
    viewer: TaskViewer,
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

            const task = await tx.task.findFirst({
              where: {
                ...this.getAccessibleTaskWhere(currentUser),
                id,
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                title: true,
                status: true,
                isBlocked: true,
                blockedReason: true,
                updatedAt: true,
                participants: {
                  select: {
                    userId: true,
                  },
                },
              },
            });

            if (!task) {
              throw new NotFoundException(
                'La tarea no existe o no está disponible.',
              );
            }

            if (input.isBlocked && task.status === 'COMPLETED') {
              throw new BadRequestException(
                'No puedes bloquear una tarea completada.',
              );
            }

            const blockedReason = input.isBlocked ? input.blockedReason : null;

            if (
              task.isBlocked === input.isBlocked &&
              task.blockedReason === blockedReason
            ) {
              return {
                id: task.id,
                workspaceId: task.workspaceId,
                parentId: task.parentId,
                status: task.status,
                isBlocked: task.isBlocked,
                blockedReason: task.blockedReason,
                updatedAt: task.updatedAt,
              };
            }

            const updatedTask = await tx.task.update({
              where: {
                id: task.id,
              },
              data: {
                isBlocked: input.isBlocked,
                blockedReason,
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                status: true,
                isBlocked: true,
                blockedReason: true,
                updatedAt: true,
              },
            });

            const action =
              !task.isBlocked && updatedTask.isBlocked
                ? 'BLOCKED'
                : task.isBlocked && !updatedTask.isBlocked
                  ? 'UNBLOCKED'
                  : 'BLOCK_REASON_CHANGED';

            await tx.taskHistoryEntry.create({
              data: {
                taskId: task.id,
                actorId: currentUser.id,
                actorName: currentUser.name,
                action,
                schemaVersion: 1,
                createdAt: updatedTask.updatedAt,
                changes: {
                  isBlocked: {
                    before: task.isBlocked,
                    after: updatedTask.isBlocked,
                  },
                  blockedReason: {
                    before: task.blockedReason,
                    after: updatedTask.blockedReason,
                  },
                },
              },
            });
            if (action !== 'BLOCK_REASON_CHANGED') {
              const recipientIds = this.getNotificationRecipientIds(
                task.participants.map((participant) => participant.userId),
                currentUser.id,
              );

              if (recipientIds.length > 0) {
                const isBlockedNow = action === 'BLOCKED';

                await this.taskNotificationsService.createForRecipients(tx, {
                  recipientIds,
                  taskId: task.id,
                  actorId: currentUser.id,
                  actorName: currentUser.name,
                  type: isBlockedNow ? 'TASK_BLOCKED' : 'TASK_UNBLOCKED',
                  title: isBlockedNow
                    ? 'Una tarea fue bloqueada'
                    : 'Una tarea fue desbloqueada',
                  body: isBlockedNow
                    ? `${currentUser.name} bloqueó "${task.title}": ${updatedTask.blockedReason}`
                    : `${currentUser.name} desbloqueó "${task.title}"`,
                });
              }
            }

            return updatedTask;
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
            'Hubo cambios simultáneos. Intenta actualizar el bloqueo nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'No se pudo actualizar el bloqueo de la tarea.',
    );
  }

  async updateTask(id: string, input: UpdateTaskInput, viewer: TaskViewer) {
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

            const task = await tx.task.findFirst({
              where: {
                ...this.getAccessibleTaskWhere(currentUser),
                id,
              },
              select: {
                id: true,
                workspaceId: true,
                parentId: true,
                title: true,
                description: true,
                priority: true,
                status: true,
                startsAt: true,
                dueAt: true,
                createdAt: true,
                updatedAt: true,
                parent: {
                  select: {
                    status: true,
                    participants: {
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
                participants: {
                  select: {
                    userId: true,
                    role: true,
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            });

            if (!task) {
              throw new NotFoundException(
                'La tarea no existe o no está disponible.',
              );
            }

            const isResponsible = task.participants.some(
              (participant) =>
                participant.userId === currentUser.id &&
                participant.role === 'RESPONSIBLE',
            );

            if (!currentUser.isAdmin && !isResponsible) {
              throw new ForbiddenException(
                'Solo un administrador o un responsable puede editar esta tarea.',
              );
            }

            if (task.status === 'COMPLETED') {
              throw new BadRequestException(
                'Un administrador debe reabrir la tarea antes de editarla.',
              );
            }

            if (task.parent?.status === 'COMPLETED') {
              throw new BadRequestException(
                'Un administrador debe reabrir la tarea principal antes de editar esta subtarea.',
              );
            }

            const data: Prisma.TaskUpdateInput = {};

            const changes: Record<string, Prisma.InputJsonValue> = {};
            let finalParticipantIds = task.participants.map(
              (participant) => participant.userId,
            );
            let addedParticipantIds: string[] = [];

            if (input.title !== undefined && input.title !== task.title) {
              data.title = input.title;

              changes.title = {
                before: task.title,
                after: input.title,
              };
            }

            if (
              input.description !== undefined &&
              input.description !== task.description
            ) {
              data.description = input.description;

              changes.description = {
                before: task.description,
                after: input.description,
              };
            }

            if (
              input.priority !== undefined &&
              input.priority !== task.priority
            ) {
              data.priority = input.priority;

              changes.priority = {
                before: task.priority,
                after: input.priority,
              };
            }

            if (input.dueAt !== undefined) {
              const dueAt = new Date(input.dueAt);
              const startsAt = task.startsAt ?? task.createdAt;

              if (dueAt < startsAt) {
                throw new BadRequestException(
                  'La entrega no puede ser anterior al inicio de la tarea.',
                );
              }

              if (dueAt.getTime() !== task.dueAt.getTime()) {
                data.dueAt = dueAt;

                changes.dueAt = {
                  before: task.dueAt.toISOString(),
                  after: dueAt.toISOString(),
                };
              }
            }

            const changesParticipants =
              input.responsibleIds !== undefined ||
              input.collaboratorIds !== undefined;

            if (changesParticipants) {
              const responsibleIds =
                input.responsibleIds ??
                task.participants
                  .filter((participant) => participant.role === 'RESPONSIBLE')
                  .map((participant) => participant.userId);

              const collaboratorIds =
                input.collaboratorIds ??
                task.participants
                  .filter((participant) => participant.role === 'COLLABORATOR')
                  .map((participant) => participant.userId);

              if (responsibleIds.length === 0) {
                throw new BadRequestException(
                  'La tarea debe tener al menos un responsable.',
                );
              }

              const responsibleSet = new Set(responsibleIds);

              if (
                collaboratorIds.some((userId) => responsibleSet.has(userId))
              ) {
                throw new BadRequestException(
                  'Un usuario no puede ser responsable y colaborador de la misma tarea.',
                );
              }

              const participantIds = [...responsibleIds, ...collaboratorIds];

              if (task.parent) {
                const parentParticipantIds = new Set(
                  task.parent.participants.map(
                    (participant) => participant.userId,
                  ),
                );
                const hasParticipantsOutsideParent = participantIds.some(
                  (userId) => !parentParticipantIds.has(userId),
                );

                if (hasParticipantsOutsideParent) {
                  throw new BadRequestException(
                    'Los responsables y colaboradores de la subtarea deben participar en la tarea principal.',
                  );
                }
              }

              if (task.parentId === null) {
                const nextParticipantIds = new Set(participantIds);

                const removedParticipantIds = task.participants
                  .filter(
                    (participant) =>
                      !nextParticipantIds.has(participant.userId),
                  )
                  .map((participant) => participant.userId);

                if (removedParticipantIds.length > 0) {
                  const subtaskWithRemovedParticipant = await tx.task.findFirst(
                    {
                      where: {
                        parentId: task.id,
                        archivedAt: null,
                        participants: {
                          some: {
                            userId: {
                              in: removedParticipantIds,
                            },
                          },
                        },
                      },
                      select: {
                        id: true,
                      },
                    },
                  );

                  if (subtaskWithRemovedParticipant) {
                    throw new BadRequestException(
                      'Antes de retirar participantes de la tarea principal, retíralos de sus subtareas no archivadas.',
                    );
                  }
                }
              }

              const activeMembers = await tx.workspaceMember.findMany({
                where: {
                  workspaceId: task.workspaceId,
                  userId: {
                    in: participantIds,
                  },
                  user: {
                    status: 'ACTIVE',
                  },
                },
                select: {
                  userId: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              });

              if (activeMembers.length !== participantIds.length) {
                throw new BadRequestException(
                  'Todos los participantes deben ser miembros activos del espacio.',
                );
              }

              const nextParticipants = [
                ...responsibleIds.map((userId) => ({
                  userId,
                  role: 'RESPONSIBLE' as const,
                })),
                ...collaboratorIds.map((userId) => ({
                  userId,
                  role: 'COLLABORATOR' as const,
                })),
              ];

              const currentRoles = new Map(
                task.participants.map((participant) => [
                  participant.userId,
                  participant.role,
                ]),
              );
              const changedParticipants = nextParticipants.filter(
                (participant) =>
                  currentRoles.get(participant.userId) !== participant.role,
              );

              const participantsChanged =
                changedParticipants.length > 0 ||
                nextParticipants.length !== task.participants.length;

              finalParticipantIds = participantIds;

              if (participantsChanged) {
                addedParticipantIds = participantIds.filter(
                  (userId) => !currentRoles.has(userId),
                );

                const memberNames = new Map(
                  activeMembers.map((member) => [
                    member.userId,
                    member.user.name,
                  ]),
                );

                changes.participants = {
                  before: task.participants
                    .map((participant) => ({
                      userId: participant.userId,
                      name: participant.user.name,
                      role: participant.role,
                    }))
                    .sort((a, b) => a.userId.localeCompare(b.userId)),

                  after: nextParticipants
                    .map((participant) => ({
                      userId: participant.userId,
                      name: memberNames.get(participant.userId)!,
                      role: participant.role,
                    }))
                    .sort((a, b) => a.userId.localeCompare(b.userId)),
                };

                data.participants = {
                  deleteMany: {
                    userId: {
                      notIn: participantIds,
                    },
                  },
                  upsert: changedParticipants.map((participant) => ({
                    where: {
                      taskId_userId: {
                        taskId: task.id,
                        userId: participant.userId,
                      },
                    },
                    update: {
                      role: participant.role,
                    },
                    create: {
                      userId: participant.userId,
                      role: participant.role,
                    },
                  })),
                };
              }
            }

            if (Object.keys(changes).length === 0) {
              return {
                id: task.id,
                workspaceId: task.workspaceId,
                parentId: task.parentId,
                updatedAt: task.updatedAt,
              };
            }

            const updatedTask = await tx.task.update({
              where: {
                id: task.id,
              },
              data,
              select: {
                id: true,
                parentId: true,
                workspaceId: true,
                updatedAt: true,
              },
            });

            await tx.taskHistoryEntry.create({
              data: {
                taskId: task.id,
                actorId: currentUser.id,
                actorName: currentUser.name,
                action: 'UPDATED',
                schemaVersion: 1,
                createdAt: updatedTask.updatedAt,
                changes,
              },
            });

            const nextTitle = input.title ?? task.title;

            const newRecipientIds = this.getNotificationRecipientIds(
              addedParticipantIds,
              currentUser.id,
            );

            if (newRecipientIds.length > 0) {
              await this.taskNotificationsService.createForRecipients(tx, {
                recipientIds: newRecipientIds,
                taskId: task.id,
                actorId: currentUser.id,
                actorName: currentUser.name,
                type: 'TASK_ASSIGNED',
                title: task.parentId
                  ? 'Te asignaron una subtarea'
                  : 'Te asignaron una tarea',
                body: `${currentUser.name} te asignó: ${nextTitle}`,
              });
            }

            if (changes.dueAt || changes.priority) {
              const addedSet = new Set(addedParticipantIds);

              const existingRecipientIds = this.getNotificationRecipientIds(
                finalParticipantIds.filter((userId) => !addedSet.has(userId)),
                currentUser.id,
              );

              if (existingRecipientIds.length > 0) {
                const whatChanged = [
                  changes.dueAt ? 'la fecha de entrega' : null,
                  changes.priority ? 'la prioridad' : null,
                ]
                  .filter(Boolean)
                  .join(' y ');

                await this.taskNotificationsService.createForRecipients(tx, {
                  recipientIds: existingRecipientIds,
                  taskId: task.id,
                  actorId: currentUser.id,
                  actorName: currentUser.name,
                  type: 'TASK_UPDATED',
                  title: 'Se actualizó una tarea',
                  body: `${currentUser.name} cambió ${whatChanged} de "${nextTitle}"`,
                });
              }
            }
            return updatedTask;
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
            'Hubo cambios simultáneos. Intenta guardar la tarea nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('No se pudo actualizar la tarea.');
  }

  async findHistory(id: string, viewer: TaskViewer, query: TaskHistoryQuery) {
    const { page, pageSize } = query;

    return this.prisma.$transaction(
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
        if (!currentUser || currentUser.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'No tienes acceso activo a esta plataforma.',
          );
        }

        const task = await tx.task.findFirst({
          where: {
            ...this.getAccessibleTaskWhere(currentUser),
            id,
          },
          select: {
            id: true,
          },
        });

        if (!task) {
          throw new NotFoundException(
            'La tarea no existe o no está disponible.',
          );
        }
        const total = await tx.taskHistoryEntry.count({
          where: {
            taskId: task.id,
          },
        });

        const entries = await tx.taskHistoryEntry.findMany({
          where: {
            taskId: task.id,
          },
          orderBy: [
            {
              createdAt: 'desc',
            },
            {
              id: 'desc',
            },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            taskId: true,
            actorId: true,
            actorName: true,
            action: true,
            changes: true,
            schemaVersion: true,
            createdAt: true,
          },
        });

        return {
          data: entries,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }

  async findSubTask(parentId: string, viewer: TaskViewer) {
    const parentTask = await this.prisma.task.findFirst({
      where: {
        id: parentId,
        parentId: null,
        archivedAt: null,
        workspace: {
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
      select: {
        id: true,
        subtasks: {
          where: {
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
          orderBy: [
            {
              dueAt: 'asc',
            },
            {
              id: 'asc',
            },
          ],
          select: {
            id: true,
            workspaceId: true,
            parentId: true,
            createdById: true,
            createdBy: true,
            title: true,
            description: true,
            priority: true,
            status: true,
            startsAt: true,
            dueAt: true,
            completedAt: true,
            isBlocked: true,
            blockedReason: true,
            createdAt: true,
            updatedAt: true,
            archivedAt: true,
            participants: {
              orderBy: {
                userId: 'asc',
              },
              select: {
                userId: true,
                role: true,
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
        },
      },
    });
    if (!parentTask) {
      throw new NotFoundException(
        'La tarea principal no existe o no está disponible.',
      );
    }
    return {
      data: parentTask.subtasks.map((task) =>
        this.withParticipantAvatarUrls(task),
      ),
    };
  }

  private withParticipantAvatarUrls<
    T extends {
      participants: Array<{
        user: {
          avatarPath: string | null;
        };
      }>;
    },
  >(task: T) {
    return {
      ...task,
      participants: task.participants.map(({ user, ...participant }) => {
        const { avatarPath, ...userData } = user;

        return {
          ...participant,
          user: {
            ...userData,
            avatarUrl: this.userAvatarsService.getPublicUrl(avatarPath),
          },
        };
      }),
    };
  }
}
