import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  createWorkspaceSchema,
  type CreateWorkspaceInput,
} from './schemas/create-workspace.schema.js';
import { type AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { WorkspacesService } from './workspace.service.js';
import {
  type UpdateWorkspaceInput,
  updateWorkspaceSchema,
} from './schemas/update-workspace.schema.js';
import { UserThrottlerGuard } from '../auth/user.throttler.guard.js';
@Controller('workspaces')
@UseGuards(AuthGuard, UserThrottlerGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createWorkspaceSchema))
    input: CreateWorkspaceInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }
    return this.workspacesService.create(input, request.authUser.id);
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('areaId', new ParseUUIDPipe({ version: '4' }))
    areaId: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.workspacesService.findAll(
      {
        id: request.authUser.id,
        isAdmin: request.authUser.isAdmin,
      },
      areaId,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }
    return this.workspacesService.findOne(id, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Get(':id/members')
  findMembers(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    if (!request.authUser) {
      throw new ForbiddenException('Debes iniciar sesión.');
    }
    return this.workspacesService.findMembers(id, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  updateWorkspace(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body(new ZodValidationPipe(updateWorkspaceSchema))
    input: UpdateWorkspaceInput,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar Sesión.');
    }
    return this.workspacesService.update(id, input, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }

  @Get(':id/edit')
  @UseGuards(AdminGuard)
  findforEdit(
    @Req() request: AuthenticatedRequest,

    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    return this.workspacesService.findForEdit(id, {
      id: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
    });
  }
}
