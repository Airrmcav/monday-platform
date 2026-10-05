import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../auth/supabase-admin.service.js';
import type { CreateUserInput } from './schemas/create-user.schema.js';
import { UpdateUserInput } from './schemas/update-user.schema.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async findAll(
    page: number,
    pageSize: number,
    search = '',
    status?: 'ACTIVE' | 'INACTIVE',
  ) {
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          isAdmin: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(input: CreateUserInput) {
    const { name, email, password, isAdmin } = input;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese correo.',
      );
    }

    const { data, error } = await this.supabaseAdmin.authAdmin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      if (
        error.code === 'email_exists' ||
        error.code === 'user_already_exists'
      ) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      if (error.code === 'weak_password') {
        throw new BadRequestException(
          'La contraseña no cumple con los requisitos de seguridad.',
        );
      }
      this.logger.error({
        message: 'Falló la creación de la cuenta en Supabase.',
        code: error.code,
        status: error.status,
      });
      throw new ServiceUnavailableException(
        'no se pudo crear la cuenta. Intenta más tarde.',
      );
    }
    const authSubject = data.user.id;

    const select = {
      id: true,
      email: true,
      name: true,
      status: true,
      isAdmin: true,
      createdAt: true,
    } as const;

    try {
      return await this.prisma.user.create({
        data: {
          authSubject,
          email,
          name,
          isAdmin,
          status: 'ACTIVE',
        },
        select,
      });
    } catch {
      let savedUser;
      try {
        savedUser = await this.prisma.user.findUnique({
          where: { authSubject },
          select,
        });
      } catch {
        this.logger.error({
          message:
            'No se pudo verificar el perfil. Se requiere revisar la cuenta.',
          authSubject,
        });

        throw new ServiceUnavailableException(
          'No se pudo confirmar el registro. Revisa el estado del usuario antes de reintentar.',
        );
      }
      if (savedUser) {
        return savedUser;
      }

      try {
        const { error: rollbackError } =
          await this.supabaseAdmin.authAdmin.deleteUser(authSubject);

        if (rollbackError) {
          this.logger.error({
            message:
              'No se pudo revertir la cuenta de Supabase. Se require revisión.',
            authSubject,
            code: rollbackError.code,
          });
        }
      } catch {
        this.logger.error({
          message: `Falló la conexión al revertir la cuenta de Supabase. Se requiere revisión.`,
          authSubject,
        });
      }
      throw new ServiceUnavailableException(
        'No se pudo completar el registro. Revisa el estado del usuario ante sde reintentar',
      );
    }
  }

  async update(id: string, input: UpdateUserInput) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const currentUser = await tx.user.findUnique({
              where: { id },
              select: {
                id: true,
                status: true,
                isAdmin: true,
              },
            });

            if (!currentUser) {
              throw new NotFoundException('El usuario no existe.');
            }
            const nextStatus = input.status ?? currentUser.status;
            const nextIsAdmin = input.isAdmin ?? currentUser.isAdmin;
            const isActiveAdmin =
              currentUser.status === 'ACTIVE' && currentUser.isAdmin;
            const willRemainActiveAdmin =
              nextStatus === 'ACTIVE' && nextIsAdmin;

            if (isActiveAdmin && !willRemainActiveAdmin) {
              const activeAdmins = await tx.user.count({
                where: {
                  status: 'ACTIVE',
                  isAdmin: true,
                },
              });
              if (activeAdmins <= 1) {
                throw new ConflictException(
                  'No puedes desactivar ni quitar permisos al último administrador activo.',
                );
              }
            }
            return tx.user.update({
              where: { id },
              data: {
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
                ...(input.isAdmin !== undefined
                  ? { isAdmin: input.isAdmin }
                  : {}),
              },
              select: {
                id: true,
                email: true,
                name: true,
                status: true,
                isAdmin: true,
                createdAt: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const isTransactionConflic =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isTransactionConflic) {
          throw error;
        }
        if (attempt === maxAttempts) {
          throw new ServiceUnavailableException(
            'Hubo cambios simultáneos en los usuarios. Intenta Nuevamente.',
          );
        }
      }
    }
    throw new ServiceUnavailableException(
      'No se pudo completar la actualización.',
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    return user;
  }
}
