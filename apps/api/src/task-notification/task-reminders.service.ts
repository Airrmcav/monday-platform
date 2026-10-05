import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  TaskNotificationType,
  TaskStatus,
  UserStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskNotificationsService } from './task-notifications.service.js';

const HOUR_IN_MS = 60 * 60 * 1000;
const DUE_SOON_WINDOW_HOURS = 24;
const BATCH_SIZE = 250;

@Injectable()
export class TaskRemindersService {
  private readonly logger = new Logger(TaskRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskNotificationsService: TaskNotificationsService,
  ) {}

  @Cron('0 * * * *', {
    name: 'task-due-reminders',
    waitForCompletion: true,
  })
  async sendDueReminders() {
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + DUE_SOON_WINDOW_HOURS * HOUR_IN_MS,
    );
    let cursor: string | undefined;
    let createdCount = 0;

    while (true) {
      const tasks = await this.prisma.task.findMany({
        where: {
          archivedAt: null,
          status: { not: TaskStatus.COMPLETED },
          participants: {
            some: { user: { status: UserStatus.ACTIVE } },
          },
          OR: [
            { dueAt: { gte: now, lte: windowEnd } },
            {
              dueAt: { lt: now },
              notifications: {
                none: { type: TaskNotificationType.TASK_OVERDUE },
              },
            },
          ],
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        select: {
          id: true,
          title: true,
          dueAt: true,
          participants: {
            where: { user: { status: UserStatus.ACTIVE } },
            select: { userId: true },
          },
        },
      });

      if (tasks.length === 0) break;

      for (const task of tasks) {
        if (task.participants.length === 0) continue;

        const overdue = task.dueAt <= now;
        const type = overdue
          ? TaskNotificationType.TASK_OVERDUE
          : TaskNotificationType.TASK_DUE_SOON;
        const dueAtLabel = new Intl.DateTimeFormat('es-MX', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'America/Mexico_City',
        }).format(task.dueAt);

        createdCount += await this.prisma.$transaction((tx) =>
          this.taskNotificationsService.createForRecipients(tx, {
            taskId: task.id,
            recipientIds: task.participants.map(({ userId }) => userId),
            actorId: null,
            actorName: null,
            type,
            title: overdue ? 'Tarea vencida' : 'Tarea próxima a vencer',
            body: overdue
              ? `"${task.title}" venció el ${dueAtLabel}.`
              : `"${task.title}" vence el ${dueAtLabel}.`,
            dedupeKey: task.dueAt.toISOString(),
          }),
        );
      }

      cursor = tasks.at(-1)?.id;
    }

    if (createdCount > 0) {
      this.logger.log(`Se crearon ${createdCount} avisos de vencimiento.`);
    }
  }
}
