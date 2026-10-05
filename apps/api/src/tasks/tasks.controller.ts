import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { TaskService } from './tasks.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  type CreateTaskInput,
  createTaskSchema,
} from './schemas/create-task.schema.js';
import {
  type UpdateTaskStatusInput,
  updateTaskStatusSchema,
} from './schemas/update-task-status.schema.js';
import {
  type UpdateTaskBlockInput,
  updateTaskBlockSchema,
} from './schemas/update-task-block.schema.js';
import {
  type UpdateTaskInput,
  updateTaskSchema,
} from './schemas/update-task.schema.js';
import {
  type TaskHistoryQuery,
  taskHistoryQuerySchema,
} from './schemas/task-history-query.schema.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';

@Controller('tasks')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class TasksController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,

    @Body(new ZodValidationPipe(createTaskSchema))
    input: CreateTaskInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar Sesión.');
    }
    return this.tasksService.create(input, request.authUser.id);
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('workspaceId', new ParseUUIDPipe({ version: '4' }))
    workspaceId: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.tasksService.findAll(workspaceId, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.tasksService.findOne(id, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Patch(':id/status')
  updateStatusTask(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body(new ZodValidationPipe(updateTaskStatusSchema))
    input: UpdateTaskStatusInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }
    return this.tasksService.updateStatusTask(id, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Patch(':id/block')
  updateBlockTask(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body(new ZodValidationPipe(updateTaskBlockSchema))
    input: UpdateTaskBlockInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.tasksService.updateBlockTask(id, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Patch(':id')
  updateTask(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body(new ZodValidationPipe(updateTaskSchema))
    input: UpdateTaskInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.tasksService.updateTask(id, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Get(':id/history')
  findHistory(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Query(new ZodValidationPipe(taskHistoryQuerySchema))
    query: TaskHistoryQuery,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.tasksService.findHistory(
      id,
      {
        id: request.authUser.id,
        isAdmin: request.authUser.isAdmin,
      },
      query,
    );
  }

  @Get(':id/subtasks')
  findSubTask(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar Sesión.');
    }
    return this.tasksService.findSubTask(id, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
}
