import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithAuthenticatedUser = {
  authUser?: {
    id: string;
  };
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(
    request: Record<string, unknown>,
  ): Promise<string> {
    const authenticatedRequest = request as RequestWithAuthenticatedUser;
    if (authenticatedRequest.authUser?.id) {
      return `user:${authenticatedRequest.authUser.id}`;
    }

    return (
      authenticatedRequest.ip ??
      authenticatedRequest.socket?.remoteAddress ??
      'unknown'
    );
  }
}
