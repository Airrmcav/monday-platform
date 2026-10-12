import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { MeetingNotificationsService } from './meeting-notifications.service.js';

@Controller('meeting-notifications')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class MeetingNotificationsController {
  constructor(
    private readonly meetingNotifications: MeetingNotificationsService,
  ) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.meetingNotifications.findAll(this.getViewerId(request));
  }

  @Patch('read-all')
  markAllAsRead(@Req() request: AuthenticatedRequest) {
    return this.meetingNotifications.markAllAsRead(this.getViewerId(request));
  }

  @Patch(':id/read')
  markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.meetingNotifications.markAsRead(id, this.getViewerId(request));
  }

  private getViewerId(request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return request.authUser.id;
  }
}
