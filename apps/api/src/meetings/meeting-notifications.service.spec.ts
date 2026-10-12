import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MeetingNotificationsService } from './meeting-notifications.service.js';

describe('MeetingNotificationsService.scheduleReminders', () => {
  it('schedules a day-before and same-day reminder once for each recipient', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const createMany = vi.fn().mockResolvedValue({ count: 6 });
    const transaction = {
      meetingNotification: { deleteMany, createMany },
    } as unknown as Prisma.TransactionClient;
    const service = new MeetingNotificationsService({} as PrismaService);
    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await service.scheduleReminders(transaction, {
      meetingId: 'meeting-1',
      organizerId: 'organizer-1',
      participantIds: ['participant-1', 'participant-1', 'participant-2'],
      startsAt,
      timeZone: 'America/Mexico_City',
    });

    expect(deleteMany).toHaveBeenCalledWith({
      where: { meetingId: 'meeting-1', sentAt: null },
    });
    expect(createMany).toHaveBeenCalledOnce();

    const reminders = createMany.mock.calls[0][0].data;
    expect(reminders).toHaveLength(6);
    expect(new Set(reminders.map(({ recipientId }) => recipientId))).toEqual(
      new Set(['organizer-1', 'participant-1', 'participant-2']),
    );
    expect(
      reminders.filter(({ type }) => type === 'DAY_BEFORE'),
    ).toHaveLength(3);
    expect(
      reminders.filter(({ type }) => type === 'SAME_DAY'),
    ).toHaveLength(3);

    const dayBefore = reminders.find(({ type }) => type === 'DAY_BEFORE');
    expect(dayBefore?.scheduledFor).toEqual(
      new Date(startsAt.getTime() - 24 * 60 * 60 * 1000),
    );
  });
});
