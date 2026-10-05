import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskCommentInput } from './schemas/create-task-comment.schema.js';
import { Prisma } from '../generated/prisma/client.js';
import { ListTaskCommentsInput } from './schemas/list-task-comments.schema.js';
import { SupabaseAdminService } from '../auth/supabase-admin.service.js';

type TaskCommentViewer = {
  id: string;
  isAdmin: boolean;
};

@Injectable()
export class TaskCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async create(
    taskId: string,
    input: CreateTaskCommentInput,
    viewer: TaskCommentViewer,
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

            const attachmentIds = input.attachmentIds;
            const now = new Date();

            if (attachmentIds.length > 0) {
              const pendingAttachments = await tx.taskAttachment.findMany({
                where: {
                  id: {
                    in: attachmentIds,
                  },
                  taskId: task.id,
                  uploadedById: currentUser.id,
                  status: 'PENDING',
                  commentId: null,
                  expiresAt: {
                    gt: now,
                  },
                },
                select: {
                  id: true,
                  storagePath: true,
                },
              });

              if (pendingAttachments.length !== attachmentIds.length) {
                throw new BadRequestException(
                  'Uno o más archivos ya no están disponibles para adjuntarse.',
                );
              }
              await this.assertFilesWereUploaded(pendingAttachments);
            }

            const comment = await tx.taskComment.create({
              data: {
                taskId: task.id,
                authorId: currentUser.id,
                authorName: currentUser.name,
                content: input.content,
              },
              select: {
                id: true,
              },
            });

            if (attachmentIds.length > 0) {
              const result = await tx.taskAttachment.updateMany({
                where: {
                  id: {
                    in: attachmentIds,
                  },
                  taskId: task.id,
                  uploadedById: currentUser.id,
                  status: 'PENDING',
                  commentId: null,
                  expiresAt: {
                    gt: now,
                  },
                },
                data: {
                  status: 'ATTACHED',
                  commentId: comment.id,
                  expiresAt: null,
                },
              });

              if (result.count !== attachmentIds.length) {
                throw new BadRequestException(
                  'Uno o más archivos ya no están disponibles para adjuntarse.',
                );
              }
            }

            return tx.taskComment.findUniqueOrThrow({
              where: {
                id: comment.id,
              },
              select: {
                id: true,
                taskId: true,
                authorId: true,
                authorName: true,
                content: true,
                createdAt: true,
                attachments: {
                  where: {
                    status: 'ATTACHED',
                  },
                  orderBy: [
                    {
                      createdAt: 'asc',
                    },
                    {
                      id: 'asc',
                    },
                  ],
                  select: {
                    id: true,
                    taskId: true,
                    commentId: true,
                    uploadedById: true,
                    uploadedByName: true,
                    originalName: true,
                    contentType: true,
                    sizeBytes: true,
                    createdAt: true,
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
            'Hubo cambios simultáneos. Intenta publicar el comentario nuevamente.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('No se pudo publicar el comentario.');
  }

  async findAll(
    taskId: string,
    input: ListTaskCommentsInput,
    viewer: TaskCommentViewer,
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

        const total = await tx.taskComment.count({
          where: {
            taskId: task.id,
          },
        });

        const comments = await tx.taskComment.findMany({
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
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: {
            id: true,
            taskId: true,
            authorId: true,
            authorName: true,
            content: true,
            createdAt: true,
            attachments: {
              where: {
                status: 'ATTACHED',
              },
              orderBy: [
                {
                  createdAt: 'asc',
                },
                {
                  id: 'asc',
                },
              ],
              select: {
                id: true,
                taskId: true,
                commentId: true,
                uploadedById: true,
                uploadedByName: true,
                originalName: true,
                contentType: true,
                sizeBytes: true,
                createdAt: true,
              },
            },
          },
        });

        return {
          data: comments,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }

  private async assertFilesWereUploaded(
    attachments: Array<{ id: string; storagePath: string }>,
  ) {
    const bucket = process.env.SUPABASE_TASK_ATTACHMENTS_BUCKET;

    if (!bucket) {
      throw new Error('Falta configurar SUPABASE_TASK_ATTACHMENTS_BUCKET.');
    }

    for (const attachment of attachments) {
      const separatorIndex = attachment.storagePath.lastIndexOf('/');

      const folder = attachment.storagePath.slice(0, separatorIndex);
      const fileName = attachment.storagePath.slice(separatorIndex + 1);

      const { data, error } = await this.supabaseAdmin.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          search: fileName,
        });

      if (error) {
        throw new ServiceUnavailableException(
          'No pudimos verificar los archivos adjuntos.',
        );
      }

      const fileExists = data.some((file) => file.name === fileName);

      if (!fileExists) {
        throw new BadRequestException(
          'Uno o más archivos no terminaron de cargarse. Intenta adjuntarlos nuevamente.',
        );
      }
    }
  }

  private getAccessibleTaskWhere(
    viewer: TaskCommentViewer,
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
}
