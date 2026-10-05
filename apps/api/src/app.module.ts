import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AreasModule } from './areas/areas.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { TaskModule } from './tasks/task.module.js';
import { TaskCommentsModule } from './task-comments/task-comments.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { UserAvatarsModule } from './user-avatars/user-avatars.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AreasModule,
    WorkspacesModule,
    TaskModule,
    TaskCommentsModule,
    DashboardModule,
    UserAvatarsModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 240,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
