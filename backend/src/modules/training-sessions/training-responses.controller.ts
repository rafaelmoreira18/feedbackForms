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
  ForbiddenException,
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

/**
 * POST   /tenants/:tenantSlug/training-responses              — public, submit response
 * GET    /tenants/:tenantSlug/training-responses              — protected, list
 * GET    /tenants/:tenantSlug/training-responses/metrics      — protected, metrics
 * GET    /tenants/:tenantSlug/training-responses/:id          — protected, single
 * DELETE /tenants/:tenantSlug/training-responses/:id          — protected, soft-delete
 */
@ApiTags('training-responses')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Controller('tenants/:tenantSlug/training-responses')
export class TrainingResponsesController {
  constructor(
    private readonly service: TrainingResponsesService,
    private readonly tenantService: TenantService,
  ) {}

  private async assertTenantAccess(tenantSlug: string, req: Request): Promise<void> {
    const tenant = await this.tenantService.findBySlug(tenantSlug);
    const user = req.user as { role: string; tenantId: string | null };
    const isGlobal = user.role === 'holding_admin' || (user.role === 'rh_admin' && user.tenantId === null);
    if (!isGlobal && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Acesso negado a este tenant');
    }
  }

  @ApiOperation({ summary: 'Submit a training survey response (public, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post()
  create(@Param('tenantSlug') tenantSlug: string, @Body() dto: CreateTrainingResponseDto) {
    return this.service.create(tenantSlug, dto);
  }

  @ApiOperation({ summary: 'Get aggregated metrics (protected)' })
  @ApiBearerAuth('access-token')
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(
    @Param('tenantSlug') tenantSlug: string,
    @Query('session') session?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req!);
    return this.service.getMetrics(tenantSlug, session, { startDate, endDate });
  }

  @ApiOperation({ summary: 'List training responses (protected)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query('session') session?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req!);
    return this.service.findAll(tenantSlug, session, { startDate, endDate });
  }

  @ApiOperation({ summary: 'Get a single training response by ID (protected)' })
  @ApiBearerAuth('access-token')
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req);
    return this.service.findById(tenantSlug, id);
  }

  @ApiOperation({ summary: 'Soft-delete a training response (rh_admin+)' })
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.assertTenantAccess(tenantSlug, req);
    return this.service.softDelete(tenantSlug, id);
  }
}
