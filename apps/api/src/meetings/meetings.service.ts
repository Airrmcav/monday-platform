import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { UserAvatarsService } from '../user-avatars/user-avatars.service.js';
import { MeetingNotificationsService } from './meeting-notifications.service.js';
import type {
  CreateMeetingInput,
  MeetingResponseInput,
  UpdateMeetingInput,
} from './schemas/meeting.schema.js';

const meetingInclude = {
  organizer: {
    select: { id: true, name: true, avatarPath: true },
  },
  participants: {
    orderBy: { user: { name: 'asc' as const } },
    include: {
      user: {
        select: { id: true, name: true, avatarPath: true },
      },
    },
  },
} as const;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatars: UserAvatarsService,
    private readonly meetingNotifications: MeetingNotificationsService,
  ) {}

  async findAll(viewerId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        OR: [
          { organizerId: viewerId },
          { participants: { some: { userId: viewerId } } },
        ],
      },
      include: meetingInclude,
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      take: 200,
    });

    return meetings.map((meeting) => this.withAvatarUrls(meeting));
  }

  async findParticipants() {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, avatarPath: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      avatarUrl: this.userAvatars.getPublicUrl(user.avatarPath),
    }));
  }

  async create(input: CreateMeetingInput, organizerId: string) {
    await this.validateParticipants(input.participantIds, organizerId);

    const meeting = await this.prisma.$transaction(async (transaction) => {
      const createdMeeting = await transaction.meeting.create({
        data: {
          title: input.title,
          description: input.description,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          timeZone: input.timeZone,
          location: input.location,
          meetingUrl: input.meetingUrl,
          organizerId,
          participants: {
            create: input.participantIds.map((userId) => ({ userId })),
          },
        },
        include: meetingInclude,
      });

      await this.meetingNotifications.scheduleReminders(transaction, {
        meetingId: createdMeeting.id,
        organizerId,
        participantIds: input.participantIds,
        startsAt: createdMeeting.startsAt,
        timeZone: createdMeeting.timeZone,
      });

      return createdMeeting;
    });

    return this.withAvatarUrls(meeting);
  }

  async update(meetingId: string, input: UpdateMeetingInput, viewerId: string) {
    const existing = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        organizerId: true,
        startsAt: true,
        endsAt: true,
        timeZone: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('No encontramos la reunión.');
    }

    if (existing.organizerId !== viewerId) {
      throw new ForbiddenException(
        'Solo quien organizó la reunión puede modificarla.',
      );
    }

    if (existing.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Solo se pueden modificar reuniones programadas.',
      );
    }

    const startsAt = input.startsAt
      ? new Date(input.startsAt)
      : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    if (input.participantIds) {
      await this.validateParticipants(input.participantIds, viewerId);
    }

    const meeting = await this.prisma.$transaction(async (transaction) => {
      if (input.participantIds) {
        await transaction.meetingParticipant.deleteMany({
          where: {
            meetingId,
            userId: { notIn: input.participantIds },
          },
        });

        await transaction.meetingParticipant.createMany({
          data: input.participantIds.map((userId) => ({
            meetingId,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      const updatedMeeting = await transaction.meeting.update({
        where: { id: meetingId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.startsAt !== undefined && { startsAt }),
          ...(input.endsAt !== undefined && { endsAt }),
          ...(input.timeZone !== undefined && { timeZone: input.timeZone }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.meetingUrl !== undefined && {
            meetingUrl: input.meetingUrl,
          }),
        },
        include: meetingInclude,
      });

      if (
        input.startsAt !== undefined ||
        input.timeZone !== undefined ||
        input.participantIds !== undefined
      ) {
        await this.meetingNotifications.scheduleReminders(transaction, {
          meetingId,
          organizerId: updatedMeeting.organizerId,
          participantIds: updatedMeeting.participants.map(
            ({ user }) => user.id,
          ),
          startsAt: updatedMeeting.startsAt,
          timeZone: updatedMeeting.timeZone,
        });
      }

      return updatedMeeting;
    });

    return this.withAvatarUrls(meeting);
  }

  async cancel(meetingId: string, viewerId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { organizerId: true, status: true },
    });

    if (!meeting) {
      throw new NotFoundException('No encontramos la reunión.');
    }

    if (meeting.organizerId !== viewerId) {
      throw new ForbiddenException(
        'Solo quien organizó la reunión puede cancelarla.',
      );
    }

    if (meeting.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Solo se pueden cancelar reuniones programadas.',
      );
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const cancelledMeeting = await transaction.meeting.update({
        where: { id: meetingId },
        data: { status: 'CANCELLED' },
        include: meetingInclude,
      });
      await transaction.meetingNotification.deleteMany({
        where: { meetingId, sentAt: null },
      });
      return cancelledMeeting;
    });

    return this.withAvatarUrls(updated);
  }

  async delete(meetingId: string, viewerId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const meeting = await transaction.meeting.findUnique({
        where: { id: meetingId },
        select: { organizerId: true, status: true },
      });

      if (!meeting) {
        throw new NotFoundException('No encontramos la reunión.');
      }

      if (meeting.organizerId !== viewerId) {
        throw new ForbiddenException(
          'Solo quien organizó la reunión puede eliminarla.',
        );
      }

      if (meeting.status !== 'CANCELLED') {
        throw new BadRequestException(
          'Solo se pueden eliminar reuniones canceladas.',
        );
      }

      await transaction.meetingNotification.deleteMany({
        where: { meetingId },
      });
      await transaction.meetingParticipant.deleteMany({
        where: { meetingId },
      });
      await transaction.meeting.delete({ where: { id: meetingId } });

      return { id: meetingId };
    });
  }

  async respond(
    meetingId: string,
    inputStatus: MeetingResponseInput['status'],
    viewerId: string,
  ) {
    const participation = await this.prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: { meetingId, userId: viewerId },
      },
      select: { status: true, meeting: { select: { status: true } } },
    });

    if (!participation) {
      throw new ForbiddenException(
        'Solo los participantes invitados pueden responder.',
      );
    }

    if (participation.meeting.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'No se puede responder a una reunión que ya no está programada.',
      );
    }

    await this.prisma.meetingParticipant.update({
      where: {
        meetingId_userId: { meetingId, userId: viewerId },
      },
      data: { status: inputStatus },
    });

    if (inputStatus === 'DECLINED') {
      await this.prisma.meetingNotification.deleteMany({
        where: {
          meetingId,
          recipientId: viewerId,
          sentAt: null,
        },
      });
    }

    return { status: inputStatus };
  }

  private async validateParticipants(
    participantIds: string[],
    organizerId: string,
  ) {
    if (participantIds.includes(organizerId)) {
      throw new BadRequestException(
        'El organizador no debe agregarse como participante.',
      );
    }

    if (participantIds.length === 0) {
      return;
    }

    const activeUsers = await this.prisma.user.findMany({
      where: {
        id: { in: participantIds },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (activeUsers.length !== participantIds.length) {
      throw new BadRequestException(
        'Todos los participantes deben ser usuarios activos.',
      );
    }
  }

  private withAvatarUrls<
    T extends {
      organizer: {
        id: string;
        name: string;
        avatarPath: string | null;
      };
      participants: Array<{
        status: string;
        user: {
          id: string;
          name: string;
          avatarPath: string | null;
        };
      }>;
    },
  >(meeting: T) {
    return {
      ...meeting,
      organizer: {
        id: meeting.organizer.id,
        name: meeting.organizer.name,
        avatarUrl: this.userAvatars.getPublicUrl(meeting.organizer.avatarPath),
      },
      participants: meeting.participants.map((participant) => ({
        status: participant.status,
        user: {
          id: participant.user.id,
          name: participant.user.name,
          avatarUrl: this.userAvatars.getPublicUrl(participant.user.avatarPath),
        },
      })),
    };
  }
}
