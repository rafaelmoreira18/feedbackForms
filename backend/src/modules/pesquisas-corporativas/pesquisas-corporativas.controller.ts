import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { PesquisasCorporativasService } from './pesquisas-corporativas.service';
import { CreatePesquisaDto } from './dto/create-pesquisa.dto';
import { UpdatePesquisaDto } from './dto/update-pesquisa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';
import { TenantService } from '../tenants/tenant.service';
import { BaseTenantController } from '../../common/base/base-tenant.controller';
import { AuditContext } from '../audit-log/audit-log.service';

function auditCtx(req: Request, tenantId: string): AuditContext {
  const user = req.user as { id?: string; email?: string } | undefined;
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;
  return { tenantId, userId: user?.id ?? null, userEmail: user?.email ?? null, ipAddress: ip };
}

@ApiTags('pesquisas-corporativas')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'mediall' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/pesquisas-corporativas')
export class PesquisasCorporativasController extends BaseTenantController {
  constructor(
    private readonly service: PesquisasCorporativasService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Listar pesquisas corporativas do tenant' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  findAll(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
    const user = req.user as { role?: string; tenantId?: string | null } | undefined;
    // holding_admin OU rh_admin sem tenantId (global) vê tudo
    const isGlobalAdmin = user?.role === 'holding_admin' || (user?.role === 'rh_admin' && !user?.tenantId);
    return this.service.findAll(tenantSlug, { isGlobalAdmin });
  }

  @ApiOperation({ summary: 'Buscar pesquisa por slug (inclui blocos e perguntas)' })
  @ApiBearerAuth('access-token')
  @Get(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  findOne(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findBySlug(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Criar pesquisa corporativa' })
  @ApiBearerAuth('access-token')
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePesquisaDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.create(tenantSlug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Atualizar pesquisa (titulo, ativa, periodo)' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdatePesquisaDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Deletar pesquisa corporativa' })
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.remove(tenantSlug, slug, auditCtx(req, tenantId));
  }
}
