import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_PUBLISHED_KEY');
    }

    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  async authenticate(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error) {
      if (!error.status || error.status >= 500 || error.status === 429) {
        throw new ServiceUnavailableException(
          'No se pudo verificar la sesión. Intenta más tarde.',
        );
      }
      throw new UnauthorizedException('La sesión no es válida o ha expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        authSubject: data.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isAdmin: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('No tienes acceso a esta plataforma.');
    }

    return user;
  }
}
