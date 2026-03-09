import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantSlug/form-templates')
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  @Get()
  findAll(@Param('tenantSlug') tenantSlug: string) {
    return this.formTemplateService.findByTenantSlug(tenantSlug);
  }

  @Get(':slug')
  findOne(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
  ) {
    return this.formTemplateService.findByTenantSlugAndFormSlug(tenantSlug, slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateFormTemplateDto,
  ) {
    return this.formTemplateService.create(tenantSlug, dto);
  }
}
