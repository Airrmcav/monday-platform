import {
  Controller,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  UseGuards,
  Get,
  BadRequestException,
  Post,
  Body,
  Patch,
  ParseUUIDPipe,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { UsersService } from './users.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  type CreateUserInput,
  createUserSchema,
} from './schemas/create-user.schema.js';
import {
  type UpdateUserInput,
  updateUserSchema,
} from './schemas/update-user.schema.js';

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number,

    @Query('search')
    search?: unknown,

    @Query('status')
    status?: unknown,
  ) {
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Page debe ser un entero positivo.');
    }

    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException(
        'PageSize debe ser un entero entre 1 y 100.',
      );
    }

    if (!Number.isSafeInteger((page - 1) * pageSize)) {
      throw new BadRequestException(
        'La página solicitada está fuera del rango permitido.',
      );
    }

    if (search !== undefined && typeof search !== 'string') {
      throw new BadRequestException('La búsqueda debe ser un texto.');
    }

    const normalizedSearch = (search ?? '').trim();

    if (normalizedSearch.length > 120) {
      throw new BadRequestException(
        'La búsqueda no puede superar los 120 caracteres.',
      );
    }

    if (status !== undefined && status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new BadRequestException('El estado debe ser ACTIVE o INACTIVE.');
    }

    return this.usersService.findAll(page, pageSize, normalizedSearch, status);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createUserSchema))
    input: CreateUserInput,
  ) {
    return this.usersService.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body(new ZodValidationPipe(updateUserSchema))
    input: UpdateUserInput,
  ) {
    return this.usersService.update(id, input);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.usersService.findOne(id);
  }
}

@Controller('users')
@UseGuards(AuthGuard)
export class UserProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/profile')
  findProfile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findPublicProfile(id);
  }
}
