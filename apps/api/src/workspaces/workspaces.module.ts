import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module.js';

import { WorkspacesService } from './workspace.service.js';
import { WorkspacesController } from './workspaces.controller.js';

@Module({
  imports: [AuthModule, PrismaModule, UserAvatarsModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
