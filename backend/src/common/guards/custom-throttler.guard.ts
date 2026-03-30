import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * Throttles by user.id when a valid JWT is present,
 * falls back to IP for unauthenticated requests.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = (req as { user?: { id?: string } }).user;
    if (user?.id) return `user:${user.id}`;
    return (req.ip as string) ?? 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Let Throttler decorators on individual routes override the global limit
    return super.shouldSkip(context);
  }
}
