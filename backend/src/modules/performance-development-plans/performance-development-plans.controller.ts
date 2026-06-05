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
import { PerformanceDevelopmentPlansService } from './performance-development-plans.service';
import { CreatePdiDto } from './dto/create-pdi.dto';
import { UpdatePdiDto } from './dto/update-pdi.dto';
import { SubmitManagerDto } from './dto/submit-manager.dto';
import { SubmitColaboradorDto } from './dto/submit-colaborador.dto';
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
 * GET    /tenants/:tenantSlug/performance-development-plans           — protegido (RH), lista (filtrada por criador)
 * GET    /tenants/:tenantSlug/performance-development-plans/:slug     — público (form + relatório)
 * POST   /tenants/:tenantSlug/performance-development-plans           — rh_admin | hospital_admin | holding_admin
 * PATCH  /tenants/:tenantSlug/performance-development-plans/:slug     — rh_admin | hospital_admin | holding_admin
 * DELETE /tenants/:tenantSlug/performance-development-plans/:slug     — holding_admin
 * POST   /tenants/:tenantSlug/performance-development-plans/:slug/manager     — público (PDI do gestor)
 * POST   /tenants/:tenantSlug/performance-development-plans/:slug/colaborador — público (validação do colaborador)
 */
@ApiTags('performance-development-plans')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/performance-development-plans')
export class PerformanceDevelopmentPlansController extends BaseTenantController {
  constructor(
    private readonly service: PerformanceDevelopmentPlansService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Lista PDIs (protegido — cada admin vê os seus)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async findAll(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    const user = req.user as { id: string; role: string; tenantId: string | null };
    const isGlobal =
      user.role === 'holding_admin' ||
      (user.role === 'rh_admin' && user.tenantId === null);
    return this.service.findAll(tenantSlug, { isGlobal, userId: user.id });
  }

  @ApiOperation({ summary: 'Obtém um PDI por slug (público)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Get(':slug')
  findOne(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findBySlug(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Cria um PDI a partir de uma avaliação concluída' })
  @ApiBearerAuth('access-token')
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePdiDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    const user = req.user as { id: string };
    return this.service.create(tenantSlug, dto, user.id ?? null, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Atualiza um PDI (active)' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdatePdiDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Exclui um PDI' })
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

  @ApiOperation({ summary: 'Gestor preenche o PDI (público, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post(':slug/manager')
  submitManager(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitManagerDto,
    @Req() req: Request,
  ) {
    return this.service.submitManager(tenantSlug, slug, dto, publicCtx(tenantSlug, req));
  }

  @ApiOperation({ summary: 'Colaborador valida o PDI (público, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post(':slug/colaborador')
  submitColaborador(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitColaboradorDto,
    @Req() req: Request,
  ) {
    return this.service.submitColaborador(tenantSlug, slug, dto, publicCtx(tenantSlug, req));
  }
}
