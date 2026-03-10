import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req: Request = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const tenantSlug = (req.params as Record<string, string>)['tenantSlug'] ?? '-';
    const userId: string = (req.user as { id?: string } | undefined)?.id ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${url} ${res.statusCode} ${duration}ms tenant=${tenantSlug} user=${userId}`,
        );
      }),
    );
  }
}
