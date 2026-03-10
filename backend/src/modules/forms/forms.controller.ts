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
import { Form3Service } from './forms.service';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantService } from '../tenants/tenant.service';

/**
 * POST   /tenants/:tenantSlug/forms3         — public, submit response
 * GET    /tenants/:tenantSlug/forms3         — protected (any role), list responses
 * GET    /tenants/:tenantSlug/forms3/metrics — protected (any role), analytics
 * GET    /tenants/:tenantSlug/forms3/:id     — protected (any role), single response
 * DELETE /tenants/:tenantSlug/forms3/:id     — protected (hospital_admin+), soft-delete one
 * DELETE /tenants/:tenantSlug/forms3         — protected (hospital_admin+), hard-delete all
 */
@ApiTags('forms3')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug (e.g. "hgm")', example: 'hgm' })
@Controller('tenants/:tenantSlug/forms3')
export class Form3Controller {
  constructor(
    private readonly form3Service: Form3Service,
    private readonly tenantService: TenantService,
  ) {}

  private async tenantId(slug: string): Promise<string> {
    const tenant = await this.tenantService.findBySlug(slug);
    return tenant.id;
  }

  @ApiOperation({ summary: 'Submit a form 3 response (public, rate-limited to 5/min)' })
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateForm3Dto,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Get aggregated metrics for analytics (all roles)' })
  @ApiBearerAuth('access-token')
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filters: FilterForm3Dto,
    @Req() _req: Request,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.getMetrics(tenantId, filters);
  }

  @ApiOperation({ summary: 'List paginated responses with optional filters (all roles)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filters: FilterForm3Dto,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.findAll(tenantId, filters);
  }

  @ApiOperation({ summary: 'Soft-delete a single response (hospital_admin or holding_admin only)' })
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('hospital_admin', 'holding_admin')
  async softDeleteOne(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.softDeleteOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Hard-delete all responses for this tenant (hospital_admin or holding_admin only)' })
  @ApiBearerAuth('access-token')
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('hospital_admin', 'holding_admin')
  async deleteAll(@Param('tenantSlug') tenantSlug: string) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.deleteAll(tenantId);
  }

  @ApiOperation({ summary: 'Get a single response by ID (all roles)' })
  @ApiBearerAuth('access-token')
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.findById(tenantId, id);
  }
}
