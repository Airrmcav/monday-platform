import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { UserAvatarsService } from './user-avatars.service.js';
import {
  type ConfirmAvatarUploadInput,
  type CreateAvatarUploadIntentInput,
  confirmAvatarUploadSchema,
  createAvatarUploadIntentSchema,
} from './schemas/user-avatar.schema.js';

@Controller('users/me/avatar')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class UserAvatarsController {
  constructor(private readonly userAvatarsService: UserAvatarsService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('upload-intent')
  createUploadIntent(
    @Req() request: AuthenticatedRequest,

    @Body(new ZodValidationPipe(createAvatarUploadIntentSchema))
    input: CreateAvatarUploadIntentInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.userAvatarsService.createUploadIntent(input, {
      id: request.authUser.id,
    });
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  confirmUpload(
    @Req() request: AuthenticatedRequest,

    @Body(new ZodValidationPipe(confirmAvatarUploadSchema))
    input: ConfirmAvatarUploadInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.userAvatarsService.confirmUpload(input, {
      id: request.authUser.id,
    });
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Delete()
  removeAvatar(@Req() request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.userAvatarsService.removeAvatar({
      id: request.authUser.id,
    });
  }
}
