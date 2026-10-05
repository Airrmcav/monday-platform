import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaskNotificationsController } from './task-notifications.controller.js';
import { TaskNotificationsService } from './task-notifications.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaskNotificationsController],
  providers: [TaskNotificationsService],
  exports: [TaskNotificationsService],
})
export class TaskNotificationsModule {}
