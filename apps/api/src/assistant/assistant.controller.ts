import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AssistantService } from './assistant.service.js';
import {
  type AssistantChatInput,
  assistantChatSchema,
} from './schemas/assistant-chat.schema.js';

@Controller('assistant')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  chat(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(assistantChatSchema))
    input: AssistantChatInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.assistantService.chat(
      {
        id: request.authUser.id,
        isAdmin: request.authUser.isAdmin,
      },
      input,
    );
  }
}
