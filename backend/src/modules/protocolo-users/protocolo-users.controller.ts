import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProtocoloUsersService } from './protocolo-users.service';
import { CreateProtocoloUserDto } from './dto/create-protocolo-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';

type AuthedRequest = Request & {
  user: { id: string; role: string; tenantId: string | null };
};

function isGlobal(req: AuthedRequest): boolean {
  return req.user.role === 'protocolo_admin_global' || req.user.role === 'holding_admin';
}

/**
 * Gestão de usuários do módulo Protocolos.
 *   - admin global (protocolo_admin_global / holding_admin): gerencia todas as unidades.
 *   - admin de unidade (protocolo_admin): gerencia apenas operadores da própria unidade.
 */
@Sistema('feedbackforms')
@Controller('protocolos/usuarios')
@UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
@Roles('protocolo_admin', 'protocolo_admin_global', 'holding_admin')
export class ProtocoloUsersController {
  constructor(private readonly service: ProtocoloUsersService) {}

  @Get('tenants')
  findTenants(@Req() req: AuthedRequest) {
    if (!isGlobal(req)) throw new ForbiddenException('Acesso restrito ao administrador global');
    return this.service.findTenants();
  }

  @Get()
  findAll(@Req() req: AuthedRequest) {
    // Admin de unidade vê apenas a própria unidade; global vê todas.
    const scope = isGlobal(req) ? undefined : req.user.tenantId;
    return this.service.findAll(scope);
  }

  @Post()
  async create(@Body() dto: CreateProtocoloUserDto, @Req() req: AuthedRequest) {
    if (!isGlobal(req)) {
      // Admin de unidade cria apenas operador/médico na própria unidade
      if (dto.role !== 'protocolo_operador' && dto.role !== 'protocolo_medico') {
        throw new ForbiddenException('Você só pode criar operadores e médicos');
      }
      dto.tenantId = req.user.tenantId ?? undefined;
    }
    if (dto.role !== 'protocolo_admin_global' && !dto.tenantId) {
      throw new BadRequestException('Unidade (tenantId) é obrigatória para este perfil');
    }
    return this.service.create(dto);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Req() req: AuthedRequest,
  ) {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter ao menos 8 caracteres');
    }
    await this.assertScope(id, req);
    await this.service.resetPassword(id, body.newPassword);
    return { message: 'Senha redefinida. O usuário deverá alterá-la no próximo acesso.' };
  }

  @Patch(':id/ativo')
  async setActive(
    @Param('id') id: string,
    @Body() body: { ativo: boolean },
    @Req() req: AuthedRequest,
  ) {
    await this.assertScope(id, req);
    await this.service.setActive(id, !!body.ativo, isGlobal(req) ? undefined : req.user.tenantId);
    return { ativo: !!body.ativo };
  }

  /** Garante que o admin de unidade só altere usuários da própria unidade. */
  private async assertScope(userId: string, req: AuthedRequest): Promise<void> {
    if (isGlobal(req)) return;
    const tenantId = await this.service.findUserTenant(userId);
    if (tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Usuário fora da sua unidade');
    }
  }
}
