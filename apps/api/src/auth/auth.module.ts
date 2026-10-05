import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { AuthController } from './auth.controller.js';
import { AdminGuard } from './admin.guard.js';
import { SupabaseAdminService } from './supabase-admin.service.js';
import { UserThrottlerGuard } from './user.throttler.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    AdminGuard,
    SupabaseAdminService,
    UserThrottlerGuard,
  ],
  exports: [
    AuthService,
    AuthGuard,
    AdminGuard,
    SupabaseAdminService,
    UserThrottlerGuard,
  ],
})
export class AuthModule {}
