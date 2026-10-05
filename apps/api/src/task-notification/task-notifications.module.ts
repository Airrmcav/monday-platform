import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaskNotificationsController } from './task-notifications.controller.js';
import { TaskNotificationsService } from './task-notifications.service.js';
import { TaskRemindersService } from './task-reminders.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaskNotificationsController],
  providers: [TaskNotificationsService, TaskRemindersService],
  exports: [TaskNotificationsService],
})
export class TaskNotificationsModule {}
