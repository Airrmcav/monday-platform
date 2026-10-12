import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module.js';
import { MeetingNotificationsController } from './meeting-notifications.controller.js';
import { MeetingNotificationsService } from './meeting-notifications.service.js';
import { MeetingsController } from './meetings.controller.js';
import { MeetingsService } from './meetings.service.js';

@Module({
  imports: [AuthModule, PrismaModule, UserAvatarsModule],
  controllers: [MeetingsController, MeetingNotificationsController],
  providers: [MeetingsService, MeetingNotificationsService],
})
export class MeetingsModule {}
