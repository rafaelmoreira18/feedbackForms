import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { TrainingResponsesService } from './training-responses.service';
import { CreateTrainingResponseDto } from './dto/create-training-response.dto';
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

/**
 * POST   /tenants/:tenantSlug/training-responses              — public, submit response
 * GET    /tenants/:tenantSlug/training-responses              — protected, list
 * GET    /tenants/:tenantSlug/training-responses/metrics      — protected, metrics
 * GET    /tenants/:tenantSlug/training-responses/:id          — protected, single
 * DELETE /tenants/:tenantSlug/training-responses/:id          — protected, soft-delete
 */
@ApiTags('training-responses')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/training-responses')
export class TrainingResponsesController extends BaseTenantController {
  constructor(
    private readonly service: TrainingResponsesService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Submit a training survey response (public, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post()
  create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateTrainingResponseDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      null;
    return this.service.create(tenantSlug, dto, { tenantId: tenantSlug, ipAddress: ip });
  }

  @ApiOperation({ summary: 'Get aggregated metrics (protected)' })
  @ApiBearerAuth('access-token')
  @Get('metrics')
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async getMetrics(
    @Param('tenantSlug') tenantSlug: string,
    @Query('session') session?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req!);
    return this.service.getMetrics(tenantSlug, session, { startDate, endDate });
  }

  @ApiOperation({ summary: 'List training responses (protected)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query('session') session?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req!);
    return this.service.findAll(tenantSlug, session, { startDate, endDate });
  }

  @ApiOperation({ summary: 'Get a single training response by ID (protected)' })
  @ApiBearerAuth('access-token')
  @Get(':id')
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async findById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findById(tenantSlug, id);
  }

  @ApiOperation({ summary: 'Soft-delete a training response (rh_admin+)' })
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.softDelete(tenantSlug, id, auditCtx(req, tenantId));
  }
}
