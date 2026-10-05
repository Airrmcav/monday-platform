import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateAreaInput } from './schemas/create-area.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

type AreaViewer = {
  id: string;
  isAdmin: boolean;
};

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAreaInput) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const existingArea = await tx.area.findFirst({
              where: {
                name: {
                  equals: input.name,
                  mode: 'insensitive',
                },
              },
              select: {
                id: true,
                archivedAt: true,
              },
            });

            if (existingArea) {
              throw new ConflictException(
                existingArea.archivedAt
                  ? 'Ya existe un área archivada con ese nombre.'
                  : 'Ya existe un área con ese nombre.',
              );
            }

            return tx.area.create({
              data: {
                name: input.name,
              },
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                archivedAt: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException('Ya existe un área con ese nombre.');
          }

          if (error.code === 'P2034') {
            if (attempt < maxAttempts) {
              continue;
            }

            throw new ServiceUnavailableException(
              'Hubo cambios simultáneos en las áreas. Intenta nuevamente.',
            );
          }
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException('No se pudo crear el área.');
  }

  async findAll(viewer: AreaViewer) {
    const where: Prisma.AreaWhereInput = {
      archivedAt: null,
      ...(viewer.isAdmin
        ? {}
        : {
            workspaces: {
              some: {
                archivedAt: null,
                members: {
                  some: {
                    userId: viewer.id,
                  },
                },
              },
            },
          }),
    };
    const areas = await this.prisma.area.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    });
    return { data: areas };
  }
}
