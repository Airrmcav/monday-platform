import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { UserAvatarsService } from './user-avatars.service.js';
import {
  type ConfirmAvatarUploadInput,
  type CreateAvatarUploadIntentInput,
  confirmAvatarUploadSchema,
  createAvatarUploadIntentSchema,
} from './schemas/user-avatar.schema.js';

@Controller('users/:userId/avatar')
@UseGuards(AuthGuard, AdminGuard, UserThrottlerGuard)
export class AdminUserAvatarsController {
  constructor(private readonly userAvatarsService: UserAvatarsService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('upload-intent')
  createUploadIntent(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body(new ZodValidationPipe(createAvatarUploadIntentSchema))
    input: CreateAvatarUploadIntentInput,
  ) {
    return this.userAvatarsService.createUploadIntentForUser(input, userId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  confirmUpload(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body(new ZodValidationPipe(confirmAvatarUploadSchema))
    input: ConfirmAvatarUploadInput,
  ) {
    return this.userAvatarsService.confirmUploadForUser(input, userId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Delete()
  removeAvatar(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.userAvatarsService.removeAvatarForUser(userId);
  }
}
