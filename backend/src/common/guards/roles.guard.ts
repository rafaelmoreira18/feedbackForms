import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../../modules/user/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

/**
 * Must be used together with JwtAuthGuard (JwtAuthGuard runs first).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('hospital_admin', 'holding_admin')
 *
 * If no @Roles() decorator is present the guard allows any authenticated user.
 *
 * Tenant scoping: for non-holding_admin roles, the guard additionally
 * verifies that the user's tenantId matches the :tenantSlug route param's
 * resolved tenant. This check is done at the controller level by comparing
 * user.tenantId against the tenantId resolved from the slug.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() — any authenticated user is allowed
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) throw new ForbiddenException('Não autenticado');

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Acesso negado. Requer perfil: ${requiredRoles.join(' ou ')}`,
      );
    }

    return true;
  }
}
