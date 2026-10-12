import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

type ReminderSchedule = {
  meetingId: string;
  organizerId: string;
  participantIds: string[];
  startsAt: Date;
  timeZone: string;
};

@Injectable()
export class MeetingNotificationsService {
  private readonly logger = new Logger(MeetingNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scheduleReminders(
    transaction: Prisma.TransactionClient,
    meeting: ReminderSchedule,
  ) {
    const now = new Date();
    const recipients = [
      ...new Set([meeting.organizerId, ...meeting.participantIds]),
    ];
    const reminders: Array<{
      meetingId: string;
      recipientId: string;
      type: 'DAY_BEFORE' | 'SAME_DAY';
      scheduledFor: Date;
    }> = [];

    if (meeting.startsAt > now) {
      const dayBefore = new Date(meeting.startsAt.getTime() - DAY_IN_MS);
      if (dayBefore > now) {
        for (const recipientId of recipients) {
          reminders.push({
            meetingId: meeting.meetingId,
            recipientId,
            type: 'DAY_BEFORE',
            scheduledFor: dayBefore,
          });
        }
      }

      const sameDay = getSameDayReminderTime(
        meeting.startsAt,
        meeting.timeZone,
      );
      if (sameDay < meeting.startsAt) {
        const scheduledFor =
          sameDay > now
            ? sameDay
            : new Date(
                Math.min(
                  now.getTime(),
                  meeting.startsAt.getTime() - MINUTE_IN_MS,
                ),
              );

        for (const recipientId of recipients) {
          reminders.push({
            meetingId: meeting.meetingId,
            recipientId,
            type: 'SAME_DAY',
            scheduledFor,
          });
        }
      }
    }

    await transaction.meetingNotification.deleteMany({
      where: { meetingId: meeting.meetingId, sentAt: null },
    });

    if (reminders.length > 0) {
      await transaction.meetingNotification.createMany({
        data: reminders,
        skipDuplicates: true,
      });
    }
  }

  @Cron('* * * * *', {
    name: 'meeting-reminders',
    waitForCompletion: true,
  })
  async sendDueReminders() {
    const now = new Date();
    const result = await this.prisma.meetingNotification.updateMany({
      where: {
        sentAt: null,
        scheduledFor: { lte: now },
        meeting: {
          status: 'SCHEDULED',
          startsAt: { gt: now },
        },
        recipient: { status: 'ACTIVE' },
      },
      data: { sentAt: now },
    });

    if (result.count > 0) {
      this.logger.log(
        `Se enviaron ${result.count} recordatorios de reuniones.`,
      );
    }
  }

  async findAll(viewerId: string) {
    await this.assertActiveUser(viewerId);

    const where = { recipientId: viewerId, sentAt: { not: null } };
    const [data, unreadCount] = await Promise.all([
      this.prisma.meetingNotification.findMany({
        where,
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: {
          id: true,
          type: true,
          readAt: true,
          sentAt: true,
          meeting: {
            select: {
              id: true,
              title: true,
              startsAt: true,
              timeZone: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.meetingNotification.count({
        where: { recipientId: viewerId, sentAt: { not: null }, readAt: null },
      }),
    ]);

    return { data, unreadCount };
  }

  async markAsRead(id: string, viewerId: string) {
    await this.assertActiveUser(viewerId);
    const notification = await this.prisma.meetingNotification.findFirst({
      where: { id, recipientId: viewerId, sentAt: { not: null } },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      throw new NotFoundException(
        'La notificación no existe o no está disponible.',
      );
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.meetingNotification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
      select: { id: true, readAt: true },
    });
  }

  async markAllAsRead(viewerId: string) {
    await this.assertActiveUser(viewerId);
    const result = await this.prisma.meetingNotification.updateMany({
      where: { recipientId: viewerId, sentAt: { not: null }, readAt: null },
      data: { readAt: new Date() },
    });

    return { updatedCount: result.count };
  }

  private async assertActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No tienes acceso activo a esta plataforma.',
      );
    }
  }
}

function getSameDayReminderTime(startsAt: Date, timeZone: string) {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(startsAt);
  const date = Object.fromEntries(
    dateParts.map(({ type, value }) => [type, value]),
  );
  const dayStart = toUtcFromZonedTime(
    {
      year: Number(date.year),
      month: Number(date.month),
      day: Number(date.day),
      hour: 8,
    },
    timeZone,
  );

  return new Date(
    Math.min(dayStart.getTime(), startsAt.getTime() - 30 * MINUTE_IN_MS),
  );
}

function toUtcFromZonedTime(
  localTime: { year: number; month: number; day: number; hour: number },
  timeZone: string,
) {
  const targetTime = Date.UTC(
    localTime.year,
    localTime.month - 1,
    localTime.day,
    localTime.hour,
  );
  let result = targetTime;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(result));
    const local = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );
    const representedTime = Date.UTC(
      Number(local.year),
      Number(local.month) - 1,
      Number(local.day),
      Number(local.hour),
      Number(local.minute),
      Number(local.second),
    );
    result += targetTime - representedTime;
  }

  return new Date(result);
}
