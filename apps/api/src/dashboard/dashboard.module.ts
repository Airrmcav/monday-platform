import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UserAvatarsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
