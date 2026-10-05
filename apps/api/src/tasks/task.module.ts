import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaskService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TaskNotificationsModule } from '../task-notification/task-notifications.module.js';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module.js';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    TaskNotificationsModule,
    UserAvatarsModule,
  ],
  controllers: [TasksController],
  providers: [TaskService],
})
export class TaskModule {}
