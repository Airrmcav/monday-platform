import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MeetingsModule } from '../meetings/meetings.module.js';
import { TaskModule } from '../tasks/task.module.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';

@Module({
  imports: [AuthModule, TaskModule, MeetingsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
