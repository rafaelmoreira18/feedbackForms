import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** Public: frontend needs tenant info to display forms */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  /** Protected: any authenticated admin can list tenants */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('holding_admin', 'hospital_admin')
  findAll() {
    return this.tenantService.findAll();
  }

  /** Protected: only holding_admin can create new tenants */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('holding_admin')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }
}
