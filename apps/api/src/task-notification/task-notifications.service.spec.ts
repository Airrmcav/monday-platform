import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskNotificationsService } from './task-notifications.service.js';

describe('TaskNotificationsService.createForRecipients', () => {
  it('deduplicates automated reminders and excludes the actor', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const tx = {
      taskNotification: { createMany },
    } as unknown as Prisma.TransactionClient;
    const service = new TaskNotificationsService(
      {} as PrismaService,
    );

    const createdCount = await service.createForRecipients(tx, {
      taskId: 'task-1',
      recipientIds: ['user-1', 'user-1', 'actor-1', 'user-2'],
      actorId: 'actor-1',
      actorName: null,
      type: 'TASK_DUE_SOON',
      title: 'Tarea próxima a vencer',
      body: 'La tarea vence pronto.',
      dedupeKey: '2026-10-06T12:00:00.000Z',
    });

    expect(createdCount).toBe(2);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          recipientId: 'user-1',
          dedupeKey: '2026-10-06T12:00:00.000Z',
        }),
        expect.objectContaining({
          recipientId: 'user-2',
          dedupeKey: '2026-10-06T12:00:00.000Z',
        }),
      ],
      skipDuplicates: true,
    });
  });
});
