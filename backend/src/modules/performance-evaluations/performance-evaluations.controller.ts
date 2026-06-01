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
import { Throttle } from '@nestjs/throttler';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantService } from '../tenants/tenant.service';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';
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

function publicCtx(tenantSlug: string, req: Request): AuditContext {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null;
  return { tenantId: tenantSlug, ipAddress: ip };
}

/**
 * GET    /tenants/:tenantSlug/performance-evaluations           — protected (RH), lista (filtrada por criador)
 * GET    /tenants/:tenantSlug/performance-evaluations/:slug     — público (form + relatório)
 * POST   /tenants/:tenantSlug/performance-evaluations           — rh_admin | hospital_admin | holding_admin
 * PATCH  /tenants/:tenantSlug/performance-evaluations/:slug     — rh_admin | hospital_admin | holding_admin
 * DELETE /tenants/:tenantSlug/performance-evaluations/:slug     — holding_admin
 * POST   /tenants/:tenantSlug/performance-evaluations/:slug/manager — público (avaliação do gestor)
 * POST   /tenants/:tenantSlug/performance-evaluations/:slug/self    — público (autoavaliação do colaborador)
 */
@ApiTags('performance-evaluations')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/performance-evaluations')
export class PerformanceEvaluationsController extends BaseTenantController {
  constructor(
    private readonly service: PerformanceEvaluationsService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Lista avaliações de desempenho (protegido — cada admin vê as suas)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async findAll(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    const user = req.user as { id: string; role: string; tenantId: string | null };
    const isGlobal =
      user.role === 'holding_admin' ||
      (user.role === 'rh_admin' && user.tenantId === null);
    return this.service.findAll(tenantSlug, { isGlobal, userId: user.id });
  }

  @ApiOperation({ summary: 'Obtém uma avaliação por slug (público)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Get(':slug')
  findOne(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findBySlug(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Cria uma nova avaliação de desempenho' })
  @ApiBearerAuth('access-token')
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePerformanceEvaluationDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    const user = req.user as { id: string };
    return this.service.create(tenantSlug, dto, user.id ?? null, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Atualiza uma avaliação (cabeçalho, active)' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdatePerformanceEvaluationDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Exclui uma avaliação' })
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

  @ApiOperation({ summary: 'Submete a avaliação do gestor (público, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post(':slug/manager')
  submitManager(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitAnswersDto,
    @Req() req: Request,
  ) {
    return this.service.submitManager(tenantSlug, slug, dto, publicCtx(tenantSlug, req));
  }

  @ApiOperation({ summary: 'Submete a autoavaliação do colaborador (público, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post(':slug/self')
  submitSelf(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitAnswersDto,
    @Req() req: Request,
  ) {
    return this.service.submitSelf(tenantSlug, slug, dto, publicCtx(tenantSlug, req));
  }
}
