import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import {
  UserProfilesController,
  UsersController,
} from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UsersController, UserProfilesController],
  providers: [UsersService],
})
export class UsersModule {}
