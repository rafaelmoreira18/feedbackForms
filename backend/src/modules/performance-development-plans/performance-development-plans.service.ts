import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PerformanceDevelopmentPlanEntity,
  PdiAction,
} from './entities/performance-development-plan.entity';
import { PerformanceEvaluationEntity } from '../performance-evaluations/entities/performance-evaluation.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreatePdiDto } from './dto/create-pdi.dto';
import { UpdatePdiDto } from './dto/update-pdi.dto';
import { SubmitManagerDto } from './dto/submit-manager.dto';
import { SubmitColaboradorDto } from './dto/submit-colaborador.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';

/** Opções de listagem — quando não-global, filtra pelos PDIs do próprio criador. */
export interface ListScope {
  isGlobal: boolean;
  userId: string | null;
}

/** Normaliza as ações garantindo os campos como string. */
function normalizeActions(dto: SubmitManagerDto): PdiAction[] {
  return dto.actions.map((a) => ({
    acao: a.acao,
    responsabilidade: a.responsabilidade,
    competenciaId: a.competenciaId,
    prazo: a.prazo,
  }));
}

@Injectable()
export class PerformanceDevelopmentPlansService {
  constructor(
    @InjectRepository(PerformanceDevelopmentPlanEntity)
    private readonly repo: Repository<PerformanceDevelopmentPlanEntity>,
    @InjectRepository(PerformanceEvaluationEntity)
    private readonly evaluationRepo: Repository<PerformanceEvaluationEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Cria um PDI a partir de uma avaliação concluída (1 por avaliação).
   * Copia o cabeçalho da avaliação para a página pública e o PDF.
   */
  async create(
    tenantSlug: string,
    dto: CreatePdiDto,
    createdByUserId: string | null,
    ctx?: AuditContext,
  ): Promise<PerformanceDevelopmentPlanEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const evaluation = await this.evaluationRepo.findOne({
      where: { tenantId, slug: dto.evaluationSlug },
    });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    if (evaluation.status !== 'concluida') {
      throw new BadRequestException(
        'O PDI só pode ser criado após a avaliação ser concluída',
      );
    }

    const existing = await this.repo.findOne({
      where: { tenantId, evaluationId: evaluation.id },
    });
    if (existing) {
      throw new ConflictException('Já existe um PDI para esta avaliação');
    }

    const candidate = `${evaluation.slug}-pdi`;

    const pdi = this.repo.create({
      tenantId,
      slug: candidate,
      evaluationId: evaluation.id,
      evaluationSlug: evaluation.slug,
      colaboradorNome: evaluation.colaboradorNome,
      setor: evaluation.setor,
      cargo: evaluation.cargo,
      gestorArea: evaluation.gestorArea,
      projeto: evaluation.projeto,
      avaliador: evaluation.avaliador,
      dataAvaliacao: evaluation.dataAvaliacao,
      status: 'pendente',
      createdByUserId,
    });
    const saved = await this.repo.save(pdi);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PDI_CREATED',
      'performance_development_plan',
      saved.id,
      { colaboradorNome: evaluation.colaboradorNome, evaluationSlug: evaluation.slug },
    );

    return saved;
  }

  async findAll(
    tenantSlug: string,
    scope: ListScope,
  ): Promise<PerformanceDevelopmentPlanEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const where = scope.isGlobal
      ? { tenantId }
      : { tenantId, createdByUserId: scope.userId ?? undefined };
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findBySlug(
    tenantSlug: string,
    slug: string,
  ): Promise<PerformanceDevelopmentPlanEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pdi = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pdi) throw new NotFoundException('PDI não encontrado');
    return pdi;
  }

  async update(
    tenantSlug: string,
    slug: string,
    dto: UpdatePdiDto,
    ctx?: AuditContext,
  ): Promise<PerformanceDevelopmentPlanEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pdi = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pdi) throw new NotFoundException('PDI não encontrado');

    Object.assign(pdi, dto);
    const saved = await this.repo.save(pdi);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PDI_UPDATED',
      'performance_development_plan',
      pdi.id,
      { changes: dto },
    );

    return saved;
  }

  async remove(
    tenantSlug: string,
    slug: string,
    ctx?: AuditContext,
  ): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pdi = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pdi) throw new NotFoundException('PDI não encontrado');
    await this.repo.remove(pdi);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PDI_DELETED',
      'performance_development_plan',
      pdi.id,
      { colaboradorNome: pdi.colaboradorNome },
    );

    return { deleted: 1 };
  }

  /**
   * Gestor preenche as ações de desenvolvimento + feedback final (primeira etapa).
   * Permitido enquanto o PDI não estiver concluído.
   */
  async submitManager(
    tenantSlug: string,
    slug: string,
    dto: SubmitManagerDto,
    ctx?: AuditContext,
  ): Promise<PerformanceDevelopmentPlanEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pdi = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pdi) throw new NotFoundException('PDI não encontrado');
    if (!pdi.active) throw new BadRequestException('Este PDI está inativo');
    if (pdi.status === 'concluida') {
      throw new BadRequestException('Este PDI já foi concluído');
    }

    pdi.actions = normalizeActions(dto);
    pdi.managerFeedback = dto.managerFeedback ?? '';
    pdi.managerSubmittedAt = new Date();
    pdi.status = 'aguardando_colaborador';
    const saved = await this.repo.save(pdi);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PDI_MANAGER_SUBMITTED',
      'performance_development_plan',
      pdi.id,
      { actionsCount: pdi.actions.length },
    );

    return saved;
  }

  /**
   * Colaborador valida o PDI (segunda etapa): nome completo + comentário opcional.
   * Só é permitido após o gestor ter preenchido.
   */
  async submitColaborador(
    tenantSlug: string,
    slug: string,
    dto: SubmitColaboradorDto,
    ctx?: AuditContext,
  ): Promise<PerformanceDevelopmentPlanEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pdi = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pdi) throw new NotFoundException('PDI não encontrado');
    if (!pdi.active) throw new BadRequestException('Este PDI está inativo');
    if (pdi.status === 'pendente') {
      throw new BadRequestException(
        'Aguarde o gestor preencher o PDI antes de validar',
      );
    }
    if (pdi.status === 'concluida') {
      throw new BadRequestException('Este PDI já foi concluído');
    }

    pdi.colaboradorNomeValidacao = dto.colaboradorNome;
    pdi.colaboradorComentario = dto.comentario ?? '';
    pdi.colaboradorSubmittedAt = new Date();
    pdi.status = 'concluida';
    const saved = await this.repo.save(pdi);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PDI_COLABORADOR_SUBMITTED',
      'performance_development_plan',
      pdi.id,
      {},
    );

    return saved;
  }
}
