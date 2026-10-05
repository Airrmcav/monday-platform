import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../auth/supabase-admin.service.js';
import type {
  ConfirmAvatarUploadInput,
  CreateAvatarUploadIntentInput,
} from './schemas/user-avatar.schema.js';

type AvatarViewer = {
  id: string;
};

const EXTENSIONS: Record<CreateAvatarUploadIntentInput['contentType'], string> =
  {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

@Injectable()
export class UserAvatarsService {
  private readonly logger = new Logger(UserAvatarsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  getPublicUrl(avatarPath: string | null): string | null {
    if (!avatarPath) {
      return null;
    }

    return this.supabaseAdmin.storage
      .from(this.getBucketName())
      .getPublicUrl(avatarPath).data.publicUrl;
  }

  async createUploadIntent(
    input: CreateAvatarUploadIntentInput,
    viewer: AvatarViewer,
  ) {
    const user = await this.getActiveUser(viewer.id);
    const path = `${user.id}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;

    const { data, error } = await this.supabaseAdmin.storage
      .from(this.getBucketName())
      .createSignedUploadUrl(path);

    if (error || !data) {
      this.logger.error(
        `No se pudo crear la URL de subida del avatar: ${error?.message}`,
      );
      throw new ServiceUnavailableException(
        'No pudimos preparar la subida de la imagen. Intenta nuevamente.',
      );
    }

    return {
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
    };
  }

  async confirmUpload(input: ConfirmAvatarUploadInput, viewer: AvatarViewer) {
    const bucket = this.getBucketName();
    const user = await this.getActiveUser(viewer.id);

    const prefix = `${user.id}/`;
    const fileName = input.path.slice(prefix.length);
    if (
      !input.path.startsWith(prefix) ||
      fileName.length === 0 ||
      fileName.includes('/')
    ) {
      throw new BadRequestException('La ruta de la imagen no es válida.');
    }

    const { data: files, error: listError } = await this.supabaseAdmin.storage
      .from(bucket)
      .list(user.id, { limit: 100 });

    if (listError || !files) {
      this.logger.error(
        `No se pudo verificar el avatar subido: ${listError?.message}`,
      );
      throw new ServiceUnavailableException(
        'No pudimos confirmar la imagen. Intenta nuevamente.',
      );
    }

    if (!files.some((file) => file.name === fileName)) {
      throw new BadRequestException(
        'No encontramos la imagen subida. Vuelve a intentarlo.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarPath: input.path },
      select: { avatarPath: true },
    });
    const staleFilePaths = files
      .filter((file) => file.name !== fileName && !file.name.startsWith('.'))
      .map((file) => `${user.id}/${file.name}`);

    await this.removeFiles(bucket, staleFilePaths);

    return { avatarUrl: this.getPublicUrl(updatedUser.avatarPath) };
  }

  async removeAvatar(viewer: AvatarViewer) {
    const bucket = this.getBucketName();
    const user = await this.getActiveUser(viewer.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarPath: null },
    });

    const { data: files } = await this.supabaseAdmin.storage
      .from(bucket)
      .list(user.id, { limit: 100 });

    const filePaths = (files ?? [])
      .filter((file) => !file.name.startsWith('.'))
      .map((file) => `${user.id}/${file.name}`);

    await this.removeFiles(bucket, filePaths);

    return { avatarUrl: null };
  }

  private async removeFiles(bucket: string, paths: string[]) {
    if (paths.length === 0) {
      return;
    }

    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .remove(paths);
    if (error) {
      this.logger.warn(
        `No se pudieron eliminar ${paths.length} archivos de avatar: ${error.message}`,
      );
    }
  }

  private async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No tienes acceso activo a esta plataforma.',
      );
    }

    return user;
  }

  private getBucketName() {
    const bucket = process.env.SUPABASE_AVATARS_BUCKET;

    if (!bucket) {
      throw new Error('Falta configurar SUPABASE_AVATARS_BUCKET.');
    }

    return bucket;
  }
}
