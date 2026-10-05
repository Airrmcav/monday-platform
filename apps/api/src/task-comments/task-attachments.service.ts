import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../auth/supabase-admin.service.js';
import type { CreateTaskAttachmentUploadIntentsInput } from './schemas/create-task-attachment-upload-intents.schema.js';

type TaskAttachmentViewer = {
  id: string;
  isAdmin: boolean;
};

type PendingAttachment = {
  id: string;
  taskId: string;
  storagePath: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  expiresAt: Date;
};

const CLAIMED_EXPIRATION = new Date(0);

@Injectable()
export class TaskAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async createUploadIntents(
    taskId: string,
    input: CreateTaskAttachmentUploadIntentsInput,
    viewer: TaskAttachmentViewer,
  ) {
    const bucket = this.getBucketName();

    const pendingAttachments = await this.createPendingAttachments(
      taskId,
      input,
      viewer,
    );

    try {
      const attachments = await Promise.all(
        pendingAttachments.map(async (attachment) => {
          const { data, error } = await this.supabaseAdmin.storage
            .from(bucket)
            .createSignedUploadUrl(attachment.storagePath);

          if (error || !data) {
            throw new Error('No se pudo crear la firma de carga.');
          }

          return {
            attachmentId: attachment.id,
            bucket,
            storagePath: attachment.storagePath,
            uploadToken: data.token,
            originalName: attachment.originalName,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            expiresAt: attachment.expiresAt.toISOString(),
          };
        }),
      );

      return {
        attachments,
      };
    } catch {
      await this.prisma.taskAttachment
        .deleteMany({
          where: {
            id: {
              in: pendingAttachments.map((attachment) => attachment.id),
            },
            uploadedById: viewer.id,
            status: 'PENDING',
          },
        })
        .catch(() => undefined);

      throw new ServiceUnavailableException(
        'No pudimos preparar la carga de archivos. Intenta nuevamente.',
      );
    }
  }

  private async createPendingAttachments(
    taskId: string,
    input: CreateTaskAttachmentUploadIntentsInput,
    viewer: TaskAttachmentViewer,
  ): Promise<PendingAttachment[]> {
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
                id: taskId,
                ...this.getAccessibleTaskWhere(currentUser),
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

            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const attachments: PendingAttachment[] = [];

            for (const file of input.files) {
              const attachmentId = randomUUID();

              const attachment = await tx.taskAttachment.create({
                data: {
                  id: attachmentId,
                  taskId: task.id,
                  uploadedById: currentUser.id,
                  uploadedByName: currentUser.name,
                  status: 'PENDING',
                  storagePath: `tasks/${task.id}/${attachmentId}`,
                  originalName: file.originalName,
                  contentType: file.contentType,
                  sizeBytes: file.sizeBytes,
                  expiresAt,
                },
                select: {
                  id: true,
                  taskId: true,
                  storagePath: true,
                  originalName: true,
                  contentType: true,
                  sizeBytes: true,
                  expiresAt: true,
                },
              });

              if (!attachment.expiresAt) {
                throw new ServiceUnavailableException(
                  'No se pudo preparar la expiración de la carga.',
                );
              }

              const { expiresAt: attachmentExpiresAt, ...attachmentData } =
                attachment;

              if (!attachmentExpiresAt) {
                throw new ServiceUnavailableException(
                  'No se pudo preparar la expiración de la carga.',
                );
              }

              attachments.push({
                ...attachmentData,
                expiresAt: attachmentExpiresAt,
              });
            }

            return attachments;
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
            'Hubo cambios simultáneos. Intenta preparar los archivos nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'No se pudieron preparar los archivos.',
    );
  }

  private getBucketName(): string {
    const bucket = process.env.SUPABASE_TASK_ATTACHMENTS_BUCKET;

    if (!bucket) {
      throw new Error('Falta configurar SUPABASE_TASK_ATTACHMENTS_BUCKET.');
    }

    return bucket;
  }

  private getAccessibleTaskWhere(
    viewer: TaskAttachmentViewer,
  ): Prisma.TaskWhereInput {
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
  }

  async createDownloadUrl(
    taskId: string,
    attachmentId: string,
    viewer: TaskAttachmentViewer,
  ) {
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

    if (!currentUser || currentUser.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No tienes acceso activo a esta plataforma.',
      );
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...this.getAccessibleTaskWhere(currentUser),
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('La tarea no existe o no está disponible.');
    }

    const attachment = await this.prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: task.id,
        status: 'ATTACHED',
        comment: {
          is: {
            taskId: task.id,
          },
        },
      },
      select: {
        storagePath: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException(
        'El archivo no existe o ya no está disponible.',
      );
    }

    const bucket = this.getBucketName();

    const { data, error } = await this.supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(attachment.storagePath, 60);

    if (error || !data?.signedUrl) {
      throw new ServiceUnavailableException(
        'No pudimos preparar la descarga del archivo.',
      );
    }

    return {
      url: data.signedUrl,
    };
  }

  async cancelPendingUpload(
    taskId: string,
    attachmentId: string,
    viewer: TaskAttachmentViewer,
  ) {
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

    if (!currentUser || currentUser.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No tienes acceso activo a esta plataforma.',
      );
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...this.getAccessibleTaskWhere(currentUser),
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new NotFoundException('La tarea no existe o no está disponible.');
    }

    const attachment = await this.prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: task.id,
        uploadedById: currentUser.id,
        status: 'PENDING',
        commentId: null,
      },
      select: {
        id: true,
        storagePath: true,
        expiresAt: true,
      },
    });

    if (!attachment || !attachment.expiresAt) {
      throw new NotFoundException(
        'El archivo ya no está disponible para retirarse.',
      );
    }

    const claimed = await this.prisma.taskAttachment.updateMany({
      where: {
        id: attachment.id,
        uploadedById: currentUser.id,
        status: 'PENDING',
        commentId: null,
        expiresAt: attachment.expiresAt,
      },
      data: {
        expiresAt: CLAIMED_EXPIRATION,
      },
    });

    if (claimed.count !== 1) {
      throw new NotFoundException(
        'El archivo ya no está disponible para retirarse.',
      );
    }

    const bucket = this.getBucketName();

    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .remove([attachment.storagePath]);

    if (error) {
      await this.prisma.taskAttachment.updateMany({
        where: {
          id: attachment.id,
          uploadedById: currentUser.id,
          status: 'PENDING',
          commentId: null,
          expiresAt: CLAIMED_EXPIRATION,
        },
        data: {
          expiresAt: attachment.expiresAt,
        },
      });

      throw new ServiceUnavailableException(
        'No pudimos retirar el archivo. Intenta nuevamente.',
      );
    }

    await this.prisma.taskAttachment.deleteMany({
      where: {
        id: attachment.id,
        uploadedById: currentUser.id,
        status: 'PENDING',
        commentId: null,
        expiresAt: CLAIMED_EXPIRATION,
      },
    });
  }
}
