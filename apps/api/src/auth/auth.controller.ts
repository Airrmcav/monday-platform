import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';
import { UserThrottlerGuard } from './user.throttler.guard.js';

@Controller('auth')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class AuthController {
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return request.authUser;
  }
}
