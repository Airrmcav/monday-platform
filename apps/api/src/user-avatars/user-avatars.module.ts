import { Module } from '@nestjs/common';
import { UserAvatarsController } from './user-avatars.controller.js';
import { AdminUserAvatarsController } from './admin-user-avatars.controller.js';
import { UserAvatarsService } from './user-avatars.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserAvatarsController, AdminUserAvatarsController],
  providers: [UserAvatarsService],
  exports: [UserAvatarsService],
})
export class UserAvatarsModule {}
