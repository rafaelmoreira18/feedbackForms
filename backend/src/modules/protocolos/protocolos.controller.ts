import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { ProtocolosService } from './protocolos.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { EncerrarProtocoloDto } from './dto/encerrar-protocolo.dto';
import { SaveRascunhoDto } from './dto/save-rascunho.dto';
import { FilterProtocoloDto } from './dto/filter-protocolo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';
import { TenantService } from '../tenants/tenant.service';
import { BaseTenantController } from '../../common/base/base-tenant.controller';
import { AuditContext } from '../audit-log/audit-log.service';
import { OPERA_ROLES, ENCERRA_ROLES, ADMIN_ROLES, GLOBAL_ROLES } from './protocolo-roles';

function auditCtx(req: Request, tenantId: string): AuditContext {
  const user = req.user as { id?: string; email?: string } | undefined;
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;
  return { tenantId, userId: user?.id ?? null, userEmail: user?.email ?? null, ipAddress: ip };
}

/**
 * Multi-protocolo (Dor Torácica, Sepse, …). A ordem das etapas e a validação vivem na
 * definição do tipo (protocolo-definitions.ts); os endpoints de bloco são genéricos.
 *
 * GET    /tenants/:tenantSlug/protocolos                       — lista (filtro por tipo/etapa)
 * GET    /tenants/:tenantSlug/protocolos/abertos               — em aberto da unidade (por tipo)
 * GET    /tenants/:tenantSlug/protocolos/metrics               — indicadores (por tipo, admins)
 * GET    /tenants/:tenantSlug/protocolos/:slug                 — um protocolo
 * POST   /tenants/:tenantSlug/protocolos                       — novo paciente (protocolType no corpo)
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/blocos/:stageKey          — fecha etapa
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/blocos/:stageKey/editar   — edita etapa fechada
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/blocos/:stageKey/rascunho — salva rascunho
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/encerrar        — encerramento antecipado (médico)
 * DELETE /tenants/:tenantSlug/protocolos/:slug                 — admin global
 */
@ApiTags('protocolos')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hrpg' })
@ApiBearerAuth('access-token')
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/protocolos')
export class ProtocolosController extends BaseTenantController {
  constructor(
    private readonly service: ProtocolosService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Lista protocolos da unidade (filtro opcional por tipo/etapa)' })
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filter: FilterProtocoloDto,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findAll(tenantSlug, filter);
  }

  @ApiOperation({ summary: 'Protocolos em aberto (não concluídos) da unidade' })
  @Get('abertos')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async findAbertos(
    @Param('tenantSlug') tenantSlug: string,
    @Query('protocolType') protocolType: string | undefined,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findAbertos(tenantSlug, protocolType);
  }

  @ApiOperation({ summary: 'Indicadores da unidade por tipo de protocolo — somente administradores' })
  @Get('metrics')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getMetrics(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filter: FilterProtocoloDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.getMetrics(tenantId, filter);
  }

  @ApiOperation({ summary: 'Obtém um protocolo pelo slug' })
  @Get(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async findOne(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findBySlug(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Abre um novo protocolo (cabeçalho do paciente + tipo)' })
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateProtocoloDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.create(tenantSlug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Fecha a etapa corrente (avança o protocolo)' })
  @Patch(':slug/blocos/:stageKey')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async submitBloco(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Param('stageKey') stageKey: string,
    // Body sem classe: a validação por etapa vive na definição do tipo (validateBloco).
    @Body() dto: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.submitBloco(tenantSlug, slug, stageKey, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Edita uma etapa já fechada (registra autor/hora/campos)' })
  @Patch(':slug/blocos/:stageKey/editar')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async editarBloco(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Param('stageKey') stageKey: string,
    @Body() dto: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.editarBloco(tenantSlug, slug, stageKey, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Salva o rascunho (stand-by) de uma etapa sem fechá-la' })
  @Patch(':slug/blocos/:stageKey/rascunho')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async saveRascunho(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Param('stageKey') stageKey: string,
    @Body() dto: SaveRascunhoDto,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.saveRascunho(tenantSlug, slug, stageKey, dto.dados);
  }

  @ApiOperation({ summary: 'Encerra o protocolo antecipadamente — somente médico/admin' })
  @Patch(':slug/encerrar')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...ENCERRA_ROLES)
  async encerrar(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: EncerrarProtocoloDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.encerrar(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Exclui (soft delete) um protocolo — somente admin global' })
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...GLOBAL_ROLES)
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.remove(tenantSlug, slug, auditCtx(req, tenantId));
  }
}
