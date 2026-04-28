import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface ReqUser {
  id: string;
  role: string;
  tenantId: string | null;
}

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('holding_admin', 'hospital_admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /** GET /admin/usuarios?tenantId=<uuid|"global">
   *  - holding_admin: pode passar qualquer tenantId ou "global"
   *  - hospital_admin: ignora o parâmetro e retorna apenas o seu tenant
   */
  @Get()
  find(@Query('tenantId') tenantId: string, @Request() req: { user: ReqUser }) {
    const { role, tenantId: userTenantId } = req.user;

    if (role === 'hospital_admin') {
      if (!userTenantId) throw new ForbiddenException('Usuário sem unidade associada');
      return this.adminUsersService.findByTenant(userTenantId);
    }

    // holding_admin
    if (!tenantId) throw new BadRequestException('Selecione uma unidade para listar os usuários');
    if (tenantId === 'global') return this.adminUsersService.findGlobal();
    return this.adminUsersService.findByTenant(tenantId);
  }

  /** hospital_admin só pode criar usuários dentro do próprio tenant */
  @Post()
  create(@Body() dto: CreateAdminUserDto, @Request() req: { user: ReqUser }) {
    const { role, tenantId: userTenantId } = req.user;

    if (role === 'hospital_admin') {
      if (!userTenantId) throw new ForbiddenException('Usuário sem unidade associada');
      // força o tenantId e impede criar super_admin
      if (dto.role === 'super_admin') throw new ForbiddenException('Sem permissão para criar Admin Global');
      return this.adminUsersService.create({ ...dto, tenantId: userTenantId });
    }

    return this.adminUsersService.create(dto);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req: { user: ReqUser },
  ) {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter ao menos 8 caracteres');
    }
    await this.adminUsersService.resetPassword(id, body.newPassword, req.user.role === 'hospital_admin' ? req.user.tenantId : null);
    return { message: 'Senha redefinida. O usuário deverá alterá-la no próximo acesso.' };
  }

  @Patch(':id/ativo')
  async toggleAtivo(
    @Param('id') id: string,
    @Body() body: { ativo: boolean },
    @Request() req: { user: ReqUser },
  ) {
    if (typeof body.ativo !== 'boolean') {
      throw new BadRequestException('Campo "ativo" deve ser booleano');
    }
    await this.adminUsersService.toggleAtivo(id, body.ativo, req.user.role === 'hospital_admin' ? req.user.tenantId : null);
    return { ativo: body.ativo };
  }
}
