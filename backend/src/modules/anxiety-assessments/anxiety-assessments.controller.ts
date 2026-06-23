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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AnxietyAssessmentsService } from './anxiety-assessments.service';
import { CreateAnxietyAssessmentDto } from './dto/create-anxiety-assessment.dto';
import { UpdateAnxietyAssessmentDto } from './dto/update-anxiety-assessment.dto';
import { SubmitAnxietyAnswersDto } from './dto/submit-anxiety-answers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantService } from '../tenants/tenant.service';
import { SistemaGuard, Sistema } from '../../common/guards/sistema.guard';
import { BaseTenantController } from '../../common/base/base-tenant.controller';
import { AuditContext } from '../audit-log/audit-log.service';

function clientIp(req: Request): string | null {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    null
  );
}

function auditCtx(req: Request, tenantId: string): AuditContext {
  const user = req.user as { id?: string; email?: string } | undefined;
  return {
    tenantId,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    ipAddress: clientIp(req),
  };
}

/**
 * Avaliação de Ansiedade (BAI / GAD-7) — por colaborador.
 *
 * GET    /tenants/:tenantSlug/anxiety-assessments              — protegido, lista (RH)
 * GET    /tenants/:tenantSlug/anxiety-assessments/:slug        — público, projeção segura (link)
 * POST   /tenants/:tenantSlug/anxiety-assessments              — rh_admin | hospital_admin | holding_admin
 * POST   /tenants/:tenantSlug/anxiety-assessments/:slug/submit — público, rate-limited (colaborador)
 * PATCH  /tenants/:tenantSlug/anxiety-assessments/:slug        — rh_admin | hospital_admin | holding_admin
 * DELETE /tenants/:tenantSlug/anxiety-assessments/:slug        — holding_admin
 */
@ApiTags('anxiety-assessments')
@ApiParam({ name: 'tenantSlug', description: 'Tenant slug', example: 'hgm' })
@Sistema('feedbackforms')
@Controller('tenants/:tenantSlug/anxiety-assessments')
export class AnxietyAssessmentsController extends BaseTenantController {
  constructor(
    private readonly service: AnxietyAssessmentsService,
    tenantService: TenantService,
  ) {
    super(tenantService);
  }

  @ApiOperation({ summary: 'Lista as avaliações de ansiedade do tenant (protegido)' })
  @ApiBearerAuth('access-token')
  @Get()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async findAll(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
    await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.findAll(tenantSlug);
  }

  @ApiOperation({ summary: 'Projeção pública para o link do colaborador (sem escores)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Get(':slug')
  findPublic(@Param('tenantSlug') tenantSlug: string, @Param('slug') slug: string) {
    return this.service.findPublic(tenantSlug, slug);
  }

  @ApiOperation({ summary: 'Cria uma aplicação (provisiona BAI + GAD-7 juntos)' })
  @ApiBearerAuth('access-token')
  @Post()
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateAnxietyAssessmentDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.create(tenantSlug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Submete as respostas de um instrumento (público, rate-limited)' })
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post(':slug/submit')
  submit(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitAnxietyAnswersDto,
    @Req() req: Request,
  ) {
    return this.service.submit(tenantSlug, slug, dto, { ipAddress: clientIp(req) });
  }

  @ApiOperation({ summary: 'Edita cabeçalho / liga-desliga o link público' })
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('rh_admin', 'hospital_admin', 'holding_admin')
  async update(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateAnxietyAssessmentDto,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.update(tenantSlug, slug, dto, auditCtx(req, tenantId));
  }

  @ApiOperation({ summary: 'Remove uma avaliação de ansiedade' })
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
  @Roles('holding_admin')
  async remove(
    @Param('tenantSlug') tenantSlug: string,
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const tenantId = await this.resolveAndAssertTenant(tenantSlug, req);
    return this.service.remove(tenantSlug, slug, auditCtx(req, tenantId));
  }
}
