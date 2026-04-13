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
import { TrainingSessionsService } from './training-sessions.service';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantService } from '../tenants/tenant.service';
import { Throttle } from '@nestjs/throttler';
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

/**
 * GET    /tenants/:tenantSlug/training-sessions          — public, list active sessions
 * GET    /tenants/:tenantSlug/training-sessions/:slug    — public, single session
 * POST   /tenants/:tenantSlug/training-sessions          — rh_admin | hospital_admin | holding_admin
 * PATCH  /tenants/:tenantSlug/training-sessions/:slug    — rh_admin | hospital_admin | holding_admin
 * DELETE /tenants/:tenantSlug/training-sessions/:slug    — rh_admin | hospital_admin | holding_admin
 */
@ApiTags('training-sessions')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/training-sessions')
export class TrainingSessionsController extends BaseTenantController {
  constructor(
    private readonly service: TrainingSessionsService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'List all training sessions for a tenant (public)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Get()
  findAll(@Param('tenantSlug') tenantSlug: string) {
    return this.service.findAll(tenantSlug);
  }

  @ApiOperation({ summary: 'Get a single training session by slug (public)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Get(':slug')
  findOne(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findBySlug(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Create a new training session' })
  @ApiBearerAuth('access-token')
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateTrainingSessionDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.create(tenantSlug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Update a training session (title, date, type, instructor, active)' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateTrainingSessionDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Delete a training session' })
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.remove(tenantSlug, slug, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Create a linked eficácia session from a reação session' })
  @ApiBearerAuth('access-token')
  @Post(':slug/create-eficacia')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async createEficacia(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.createEficacia(tenantSlug, slug, auditCtx(req, tenantId));
  }
}
