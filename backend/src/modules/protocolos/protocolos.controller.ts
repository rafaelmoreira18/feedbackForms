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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { ProtocolosService } from './protocolos.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { SubmitBlocoTriagemDto } from './dto/submit-bloco-triagem.dto';
import { SubmitBlocoEcgDto } from './dto/submit-bloco-ecg.dto';
import { SubmitBlocoInvestigacaoDto } from './dto/submit-bloco-investigacao.dto';
import { SubmitBlocoDesfechoDto } from './dto/submit-bloco-desfecho.dto';
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
 * GET    /tenants/:tenantSlug/protocolos                      — lista (operador/admin)
 * GET    /tenants/:tenantSlug/protocolos/abertos              — em aberto da unidade
 * GET    /tenants/:tenantSlug/protocolos/metrics              — indicadores (admins)
 * GET    /tenants/:tenantSlug/protocolos/:slug                — um protocolo
 * POST   /tenants/:tenantSlug/protocolos                      — novo paciente
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/triagem        — fecha bloco Triagem
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/investigacao   — fecha bloco Investigação
 * PATCH  /tenants/:tenantSlug/protocolos/:slug/desfecho       — fecha bloco Desfecho (conclui)
 * DELETE /tenants/:tenantSlug/protocolos/:slug                — admin global
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

  @ApiOperation({ summary: 'Lista protocolos da unidade (filtro opcional por etapa)' })
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
  async findAbertos(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findAbertos(tenantSlug);
  }

  @ApiOperation({ summary: 'Indicadores (FORMMED026) da unidade — somente administradores' })
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

  @ApiOperation({ summary: 'Abre um novo protocolo (cabeçalho do paciente)' })
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

  @ApiOperation({ summary: 'Fecha o bloco Triagem (ETAPA 1 + ECG) e libera a Investigação' })
  @Patch(':slug/triagem')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async submitTriagem(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitBlocoTriagemDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.submitBloco(tenantSlug, slug, 'triagem', dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Fecha o bloco ECG (ETAPA 2) e libera a Investigação' })
  @Patch(':slug/ecg')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async submitEcg(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitBlocoEcgDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.submitBloco(tenantSlug, slug, 'ecg', dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Fecha o bloco Investigação (Troponina + HEART + Dx) e libera o Desfecho' })
  @Patch(':slug/investigacao')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async submitInvestigacao(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitBlocoInvestigacaoDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.submitBloco(tenantSlug, slug, 'investigacao', dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Fecha o bloco Desfecho (Trombólise + Encaminhamento) e conclui o protocolo' })
  @Patch(':slug/desfecho')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async submitDesfecho(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitBlocoDesfechoDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.submitBloco(tenantSlug, slug, 'desfecho', dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Edita uma etapa já concluída (registra autor/hora/campos)' })
  @Patch(':slug/:bloco/editar')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async editarBloco(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Param('bloco') bloco: string,
    // Body sem classe: a validação por etapa acontece no fechamento; aqui só fazemos o diff.
    @Body() dto: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    if (!['triagem', 'ecg', 'investigacao', 'desfecho'].includes(bloco)) {
      throw new BadRequestException('Bloco inválido');
    }
    return this.service.editarBloco(
      tenantSlug,
      slug,
      bloco as 'triagem' | 'ecg' | 'investigacao' | 'desfecho',
      dto as never,
      auditCtx(req, tenantId),
    );
  }

  @ApiOperation({ summary: 'Salva o rascunho (stand-by) de uma etapa sem fechá-la' })
  @Patch(':slug/:bloco/rascunho')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles(...OPERA_ROLES)
  async saveRascunho(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Param('bloco') bloco: string,
    @Body() dto: SaveRascunhoDto,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    if (!['triagem', 'ecg', 'investigacao', 'desfecho'].includes(bloco)) {
      throw new BadRequestException('Bloco inválido');
    }
    return this.service.saveRascunho(
      tenantSlug,
      slug,
      bloco as 'triagem' | 'ecg' | 'investigacao' | 'desfecho',
      dto.dados,
    );
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
