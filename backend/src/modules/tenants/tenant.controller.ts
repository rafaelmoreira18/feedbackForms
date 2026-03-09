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

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** Public: frontend needs tenant info to display forms */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  /** Protected: only admins list/create tenants */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.tenantService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }
}
