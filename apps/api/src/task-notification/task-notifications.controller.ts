import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  listTaskNotificationsSchema,
  type ListTaskNotificationsInput,
} from './schemas/list-task-notifications.schema.js';
import { TaskNotificationsService } from './task-notifications.service.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';

@Controller('task-notifications')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class TaskNotificationsController {
  constructor(
    private readonly taskNotificationsService: TaskNotificationsService,
  ) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query(new ZodValidationPipe(listTaskNotificationsSchema))
    input: ListTaskNotificationsInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.taskNotificationsService.findAll(input, {
      id: request.authUser.id,
    });
  }

  @Patch('read-all')
  markAllAsRead(@Req() request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.taskNotificationsService.markAllAsRead({
      id: request.authUser.id,
    });
  }

  @Patch(':id/read')
  markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.taskNotificationsService.markAsRead(id, {
      id: request.authUser.id,
    });
  }
}
