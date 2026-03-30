import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RhUsersService } from './rh-users.service';
import { CreateRhUserDto } from './dto/create-rh-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

type AuthedRequest = Request & { user: { id: string; role: string; tenantId: string | null } };

function assertGlobal(req: AuthedRequest) {
  if (req.user.tenantId !== null) throw new ForbiddenException('Acesso restrito ao administrador global');
}

@Controller('rh/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('rh_admin')
export class RhUsersController {
  constructor(private readonly rhUsersService: RhUsersService) {}

  @Get('tenants')
  findTenants(@Req() req: AuthedRequest) {
    assertGlobal(req);
    return this.rhUsersService.findTenants();
  }

  @Get()
  findAll(@Req() req: AuthedRequest) {
    assertGlobal(req);
    return this.rhUsersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateRhUserDto, @Req() req: AuthedRequest) {
    assertGlobal(req);
    try {
      return await this.rhUsersService.create(dto);
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw err;
    }
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Req() req: AuthedRequest,
  ) {
    assertGlobal(req);
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter ao menos 8 caracteres');
    }
    await this.rhUsersService.resetPassword(id, body.newPassword);
    return { message: 'Senha redefinida. O usuário deverá alterá-la no próximo acesso.' };
  }
}
