import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';

import { DashboardService } from './dashboard.service.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';

@Controller('dashboard')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Req() request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    return this.dashboardService.getSummary({
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
}
