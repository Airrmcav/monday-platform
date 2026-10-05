import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../auth/supabase-admin.service.js';

const BATCH_SIZE = 100;
const CLAIMED_EXPIRATION = new Date(0);

@Injectable()
export class TaskAttachmentsCleanupService {
  private readonly logger = new Logger(TaskAttachmentsCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  @Cron('0 */15 * * * *', {
    name: 'cleanup-expired-task-attachments',
    waitForCompletion: true,
  })
  async cleanupExpiredPendingAttachments() {
    const bucket = this.getBucketName();
    const now = new Date();

    const attachments = await this.prisma.taskAttachment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lte: now,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: BATCH_SIZE,
      select: {
        id: true,
        storagePath: true,
      },
    });

    if (attachments.length === 0) {
      return;
    }

    const attachmentIds = attachments.map((attachment) => attachment.id);

    await this.prisma.taskAttachment.updateMany({
      where: {
        id: {
          in: attachmentIds,
        },
        status: 'PENDING',
        expiresAt: {
          lte: now,
        },
      },
      data: {
        expiresAt: CLAIMED_EXPIRATION,
      },
    });

    const claimedAttachments = await this.prisma.taskAttachment.findMany({
      where: {
        id: {
          in: attachmentIds,
        },
        status: 'PENDING',
        expiresAt: CLAIMED_EXPIRATION,
      },
      select: {
        id: true,
        storagePath: true,
      },
    });

    if (claimedAttachments.length === 0) {
      return;
    }

    const claimedAttachmentIds = claimedAttachments.map(
      (attachment) => attachment.id,
    );

    const paths = claimedAttachments.map(
      (attachment) => attachment.storagePath,
    );

    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      this.logger.error(
        `No se pudieron eliminar ${paths.length} adjuntos expirados: ${error.message}`,
      );
      return;
    }

    const deletedAttachments = await this.prisma.taskAttachment.deleteMany({
      where: {
        id: {
          in: claimedAttachmentIds,
        },
        status: 'PENDING',
        expiresAt: CLAIMED_EXPIRATION,
      },
    });

    if (deletedAttachments.count > 0) {
      this.logger.log(
        `Se eliminaron ${deletedAttachments.count} adjuntos pendientes expirados.`,
      );
    }
  }

  private getBucketName() {
    const bucket = process.env.SUPABASE_TASK_ATTACHMENTS_BUCKET;

    if (!bucket) {
      throw new Error('Falta configurar SUPABASE_TASK_ATTACHMENTS_BUCKET.');
    }

    return bucket;
  }
}
