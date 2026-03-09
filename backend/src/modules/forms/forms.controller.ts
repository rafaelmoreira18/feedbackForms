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
import { Request } from 'express';
import { Form3Service } from './forms.service';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantService } from '../tenants/tenant.service';

/**
 * POST   /tenants/:tenantSlug/forms3         — public, submit response
 * GET    /tenants/:tenantSlug/forms3         — protected, list responses
 * GET    /tenants/:tenantSlug/forms3/metrics — protected, analytics
 * GET    /tenants/:tenantSlug/forms3/:id     — protected, single response
 * DELETE /tenants/:tenantSlug/forms3         — protected, delete all
 */
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

  @Post()
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateForm3Dto,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.create(tenantId, dto);
  }

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

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('tenantSlug') tenantSlug: string,
    @Query() filters: FilterForm3Dto,
  ) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.findAll(tenantId, filters);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteAll(@Param('tenantSlug') tenantSlug: string) {
    const tenantId = await this.tenantId(tenantSlug);
    return this.form3Service.deleteAll(tenantId);
  }

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
