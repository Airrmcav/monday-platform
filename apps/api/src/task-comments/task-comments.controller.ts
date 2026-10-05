import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createTaskCommentSchema,
  type CreateTaskCommentInput,
} from './schemas/create-task-comment.schema.js';
import { TaskCommentsService } from './task-comments.service.js';
import {
  type ListTaskCommentsInput,
  listTaskCommentsSchema,
} from './schemas/list-task-comments.schema.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { Throttle } from '@nestjs/throttler';

@Controller('tasks/:taskId/comments')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Throttle({
    default: {
      ttl: 60_000,
      limit: 20,
    },
  })
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @Body(new ZodValidationPipe(createTaskCommentSchema))
    input: CreateTaskCommentInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.taskCommentsService.create(taskId, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Get()
  getAll(
    @Req() request: AuthenticatedRequest,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @Query(new ZodValidationPipe(listTaskCommentsSchema))
    query: ListTaskCommentsInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.taskCommentsService.findAll(taskId, query, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
}
