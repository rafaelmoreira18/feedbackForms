import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SISTEMA_KEY = 'sistema';

/**
 * Decorator para exigir acesso a um sistema específico.
 * Usar APÓS JwtAuthGuard.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, SistemaGuard)
 *   @Sistema('feedbackforms')
 *
 * holding_admin tem acesso irrestrito a todos os sistemas.
 * Sistemas disponíveis: 'feedbackforms' | 'linensistem'
 */
export const Sistema = (sistema: string) => SetMetadata(SISTEMA_KEY, sistema);

interface AuthedUser {
  role: string;
  sistemas: string[];
}

@Injectable()
export class SistemaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const sistema = this.reflector.getAllAndOverride<string>(SISTEMA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem @Sistema() decorator — guard passa sem verificar
    if (!sistema) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthedUser | undefined;

    if (!user) throw new ForbiddenException('Não autenticado');
    if (user.role === 'holding_admin') return true;

    if (!user.sistemas.includes(sistema)) {
      throw new ForbiddenException(`Sistema '${sistema}' não habilitado para este usuário`);
    }

    return true;
  }
}

/**
 * Função utilitária para verificação inline nos controllers
 * quando o guard via decorator não for suficiente.
 */
export function assertSistemaJWT(user: AuthedUser, sistema: string): void {
  if (user.role === 'holding_admin') return;
  if (!user.sistemas.includes(sistema)) {
    throw new ForbiddenException(`Sistema '${sistema}' não habilitado para este usuário`);
  }
}
