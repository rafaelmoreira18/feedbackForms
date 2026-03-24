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
  ForbiddenException,
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

/**
 * GET    /tenants/:tenantSlug/training-sessions          — public, list active sessions
 * GET    /tenants/:tenantSlug/training-sessions/:slug    — public, single session
 * POST   /tenants/:tenantSlug/training-sessions          — rh_admin | hospital_admin | holding_admin
 * PATCH  /tenants/:tenantSlug/training-sessions/:slug    — rh_admin | hospital_admin | holding_admin
 * DELETE /tenants/:tenantSlug/training-sessions/:slug    — rh_admin | hospital_admin | holding_admin
 */
@ApiTags('training-sessions')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Controller('tenants/:tenantSlug/training-sessions')
export class TrainingSessionsController {
  constructor(
    private readonly service: TrainingSessionsService,
    private readonly tenantService: TenantService,
  ) {}

  /** Verify the authenticated user belongs to this tenant (or is a global admin/rh). */
  private async assertTenantAccess(tenantSlug: string, req: Request): Promise<void> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);
    const user = req.user as { role: string; tenantId: string | null };
    const isGlobal = user.role === 'holding_admin' || (user.role === 'rh_admin' && user.tenantId === null);
    if (!isGlobal && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Acesso negado a este tenant');
    }
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateTrainingSessionDto,
    @Req() req: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req);
    return this.service.create(tenantSlug, dto);
  }

  @ApiOperation({ summary: 'Update a training session (title, date, type, instructor, active)' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateTrainingSessionDto,
    @Req() req: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto);
  }

  @ApiOperation({ summary: 'Delete a training session' })
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req);
    return this.service.remove(tenantSlug, slug);
  }
}
