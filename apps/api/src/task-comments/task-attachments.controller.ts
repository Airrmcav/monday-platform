import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Redirect,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TaskAttachmentsService } from './task-attachments.service.js';
import {
  type CreateTaskAttachmentUploadIntentsInput,
  createTaskAttachmentUploadIntentsSchema,
} from './schemas/create-task-attachment-upload-intents.schema.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { Throttle } from '@nestjs/throttler';

@Controller('tasks/:taskId/attachments')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class TaskAttachmentsController {
  constructor(
    private readonly taskAttachmentsService: TaskAttachmentsService,
  ) {}

  @Throttle({
    default: {
      ttl: 60_000,
      limit: 10,
    },
  })
  @Post('upload-intents')
  createUploadIntents(
    @Req() request: AuthenticatedRequest,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @Body(new ZodValidationPipe(createTaskAttachmentUploadIntentsSchema))
    input: CreateTaskAttachmentUploadIntentsInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.taskAttachmentsService.createUploadIntents(taskId, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Throttle({
    default: {
      ttl: 60_000,
      limit: 60,
    },
  })
  @Get(':attachmentId/download')
  @Redirect()
  async download(
    @Req() request: AuthenticatedRequest,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @Param('attachmentId', new ParseUUIDPipe({ version: '4' }))
    attachmentId: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    const result = await this.taskAttachmentsService.createDownloadUrl(
      taskId,
      attachmentId,
      {
        id: request.authUser.id,
        isAdmin: request.authUser.isAdmin,
      },
    );

    return {
      url: result.url,
      statusCode: 302,
    };
  }

  @Throttle({
    default: {
      ttl: 60_000,
      limit: 30,
    },
  })
  @Delete(':attachmentId')
  async cancelPendingUpload(
    @Req() request: AuthenticatedRequest,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @Param('attachmentId', new ParseUUIDPipe({ version: '4' }))
    attachmentId: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    await this.taskAttachmentsService.cancelPendingUpload(
      taskId,
      attachmentId,
      {
        id: request.authUser.id,
        isAdmin: request.authUser.isAdmin,
      },
    );
  }
}
