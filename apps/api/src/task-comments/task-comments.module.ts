import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskCommentsController } from './task-comments.controller.js';
import { TaskCommentsService } from './task-comments.service.js';
import { TaskAttachmentsController } from './task-attachments.controller.js';
import { TaskAttachmentsService } from './task-attachments.service.js';
import { TaskAttachmentsCleanupService } from './task-attachments-cleanup.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaskCommentsController, TaskAttachmentsController],
  providers: [
    TaskCommentsService,
    TaskAttachmentsService,
    TaskAttachmentsCleanupService,
  ],
})
export class TaskCommentsModule {}
