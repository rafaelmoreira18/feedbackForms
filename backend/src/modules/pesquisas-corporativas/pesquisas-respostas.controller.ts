import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PesquisasRespostasService } from './pesquisas-respostas.service';
import { PesquisasCorporativasService } from './pesquisas-corporativas.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';
import { TenantService } from '../tenants/tenant.service';
import { BaseTenantController } from '../../common/base/base-tenant.controller';

@ApiTags('pesquisas-respostas')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'mediall' })
@Controller('tenants/:tenantSlug/pesquisas-corporativas/:slug/respostas')
export class PesquisasRespostasController extends BaseTenantController {
  constructor(
    private readonly service: PesquisasRespostasService,
    private readonly pesquisasService: PesquisasCorporativasService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  /** Endpoint público — retorna estrutura da pesquisa sem autenticação */
  @ApiOperation({ summary: 'Buscar pesquisa por slug (público, sem autenticação)' })
  @Get('estrutura')
  findEstrutura(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
  ) {
    return this.pesquisasService.findBySlug(tenantSlug, slug);
  }

  /** Endpoint público — link enviado aos colaboradores */
  @ApiOperation({ summary: 'Submeter resposta à pesquisa (público, sem autenticação)' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
  @Post()
  submit(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: CreateRespostaDto,
  ) {
    return this.service.submit(tenantSlug, slug, dto);
  }

  @ApiOperation({ summary: 'Listar respostas da pesquisa' })
  @ApiBearerAuth('access-token')
  @Sistema('feedbackforms')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  findAll(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findAll(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Métricas agregadas da pesquisa' })
  @ApiBearerAuth('access-token')
  @Sistema('feedbackforms')
  @Get('metricas')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  metricas(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.getMetricas(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Soft delete de uma resposta' })
  @ApiBearerAuth('access-token')
  @Sistema('feedbackforms')
  @Delete(':id')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'holding_admin')
  remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
    @Req() _req: Request,
  ) {
    return this.service.softDelete(tenantSlug, id);
  }
}
