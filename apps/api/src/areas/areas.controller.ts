import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { AreasService } from './areas.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  type CreateAreaInput,
  createAreaSchema,
} from './schemas/create-area.schema.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';

@Controller('areas')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createAreaSchema))
    input: CreateAreaInput,
  ) {
    return this.areasService.create(input);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.areasService.findAll({
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
}
