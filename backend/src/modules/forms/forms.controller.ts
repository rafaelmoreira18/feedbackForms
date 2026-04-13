import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Form3Service } from './forms.service';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';
import { UpdateCpfDto } from './dto/update-cpf.dto';
import { Throttle } from '@nestjs/throttler';
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
  return {
    tenantId,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    ipAddress: ip,
  };
}

/**
 * POST   /tenants/:tenantSlug/forms3          — public, submit response
 * GET    /tenants/:tenantSlug/forms3          — protected (any role), list responses
 * GET    /tenants/:tenantSlug/forms3/metrics  — protected (any role), analytics
 * GET    /tenants/:tenantSlug/forms3/:id      — protected (any role), single response
 * PATCH  /tenants/:tenantSlug/forms3/:id/cpf — protected (holding_admin only), add CPF retroactively
 * DELETE /tenants/:tenantSlug/forms3/:id      — protected (hospital_admin+), soft-delete one
 * DELETE /tenants/:tenantSlug/forms3          — protected (hospital_admin+), hard-delete all
 */
@ApiTags('forms3')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug (e.g. "hgm")', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/forms3')
export class Form3Controller extends BaseTenantController {
  constructor(
    private readonly form3Service: Form3Service,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Submit a form 3 response (public, rate-limited to 30/min)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post()
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateForm3Dto,
    @Req() req: Request,
  ) {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    return this.form3Service.create(tenantId, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Get aggregated metrics for analytics (all roles)' })
  @ApiBearerAuth('access-token')
  @Get('metrics')
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async getMetrics(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filters: FilterForm3Dto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.getMetrics(tenantId, filters);
  }

  @ApiOperation({ summary: 'List paginated responses with optional filters (all roles)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filters: FilterForm3Dto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.findAll(tenantId, filters);
  }

  @ApiOperation({ summary: 'Soft-delete a single response (hospital_admin or holding_admin only)' })
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('hospital_admin', 'holding_admin')
  async softDeleteOne(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.softDeleteOne(tenantId, id, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Hard-delete all responses for this tenant (hospital_admin or holding_admin only)' })
  @ApiBearerAuth('access-token')
  @Delete()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('hospital_admin', 'holding_admin')
  async deleteAll(
    @Param('tenantSlug') tenantSlug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.deleteAll(tenantId, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Add CPF retroactively to a response without one (holding_admin only)' })
  @ApiBearerAuth('access-token')
  @Patch(':id/cpf')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('holding_admin')
  async updateCpf(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateCpfDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.updateCpf(tenantId, id, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Get a single response by ID (all roles)' })
  @ApiBearerAuth('access-token')
  @Get(':id')
  @UseGuards(JwtAuthGuard, SistemaGuard)
  async findById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.form3Service.findById(tenantId, id);
  }
}
