import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListTaskNotificationsInput } from './schemas/list-task-notifications.schema.js';

type TaskNotificationViewer = {
  id: string;
};

type TaskNotificationTransaction = Prisma.TransactionClient;

import { TaskNotificationType } from '../generated/prisma/enums.js';

type CreateTaskNotificationsInput = {
  recipientIds: string[];
  taskId: string;
  actorId: string | null;
  actorName: string | null;
  type: TaskNotificationType;
  title: string;
  body: string;
};

@Injectable()
export class TaskNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForRecipients(
    tx: TaskNotificationTransaction,
    input: CreateTaskNotificationsInput,
  ) {
    const recipientIds = [...new Set(input.recipientIds)].filter(
      (recipientId) => recipientId !== input.actorId,
    );

    if (recipientIds.length === 0) {
      return;
    }

    await tx.taskNotification.createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        taskId: input.taskId,
        actorId: input.actorId,
        actorName: input.actorName,
        type: input.type,
        title: input.title,
        body: input.body,
      })),
    });
  }

  async findAll(
    input: ListTaskNotificationsInput,
    viewer: TaskNotificationViewer,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentUser = await tx.user.findUnique({
          where: {
            id: viewer.id,
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (!currentUser || currentUser.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'No tienes acceso activo a esta plataforma.',
          );
        }

        const where = {
          recipientId: currentUser.id,
          ...(input.unreadOnly
            ? {
                readAt: null,
              }
            : {}),
        };

        const [data, total, unreadCount] = await Promise.all([
          tx.taskNotification.findMany({
            where,
            orderBy: [
              {
                createdAt: 'desc',
              },
              {
                id: 'desc',
              },
            ],
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            select: {
              id: true,
              type: true,
              title: true,
              body: true,
              actorName: true,
              readAt: true,
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

          tx.taskNotification.count({
            where,
          }),

          tx.taskNotification.count({
            where: {
              recipientId: currentUser.id,
              readAt: null,
            },
          }),
        ]);

        return {
          data,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          },
          unreadCount,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }

  async markAsRead(id: string, viewer: TaskNotificationViewer) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentUser = await tx.user.findUnique({
          where: {
            id: viewer.id,
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (!currentUser || currentUser.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'No tienes acceso activo a esta plataforma.',
          );
        }

        const notification = await tx.taskNotification.findFirst({
          where: {
            id,
            recipientId: currentUser.id,
          },
          select: {
            id: true,
            readAt: true,
          },
        });

        if (!notification) {
          throw new NotFoundException(
            'La notificación no existe o no está disponible.',
          );
        }

        if (notification.readAt) {
          return notification;
        }

        return tx.taskNotification.update({
          where: {
            id: notification.id,
          },
          data: {
            readAt: new Date(),
          },
          select: {
            id: true,
            readAt: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async markAllAsRead(viewer: TaskNotificationViewer) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentUser = await tx.user.findUnique({
          where: {
            id: viewer.id,
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (!currentUser || currentUser.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'No tienes acceso activo a esta plataforma.',
          );
        }

        const result = await tx.taskNotification.updateMany({
          where: {
            recipientId: currentUser.id,
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });

        return {
          updatedCount: result.count,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
