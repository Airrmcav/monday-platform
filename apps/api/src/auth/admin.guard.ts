import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authUser) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    if (!request.authUser.isAdmin) {
      throw new ForbiddenException(
        'Esta acción requiere permisos de Administrador.',
      );
    }

    return true;
  }
}
