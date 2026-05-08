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

function assertGlobal(req: { user: ReqUser }) {
  if (req.user.tenantId !== null) throw new ForbiddenException('Acesso restrito ao administrador global');
}

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('holding_admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  find(@Query('tenantId') tenantId: string, @Request() req: { user: ReqUser }) {
    assertGlobal(req);
    if (!tenantId) throw new BadRequestException('Selecione uma unidade para listar os usuários');
    if (tenantId === 'global') return this.adminUsersService.findGlobal();
    return this.adminUsersService.findByTenant(tenantId);
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto, @Request() req: { user: ReqUser }) {
    assertGlobal(req);
    return this.adminUsersService.create(dto);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req: { user: ReqUser },
  ) {
    assertGlobal(req);
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter ao menos 8 caracteres');
    }
    await this.adminUsersService.resetPassword(id, body.newPassword);
    return { message: 'Senha redefinida. O usuário deverá alterá-la no próximo acesso.' };
  }

  @Patch(':id/ativo')
  async toggleAtivo(
    @Param('id') id: string,
    @Body() body: { ativo: boolean },
    @Request() req: { user: ReqUser },
  ) {
    assertGlobal(req);
    if (typeof body.ativo !== 'boolean') {
      throw new BadRequestException('Campo "ativo" deve ser booleano');
    }
    await this.adminUsersService.toggleAtivo(id, body.ativo);
    return { ativo: body.ativo };
  }
}
