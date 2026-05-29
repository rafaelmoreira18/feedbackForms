import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PerformanceEvaluationEntity,
  PerformanceAnswer,
} from './entities/performance-evaluation.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreatePerformanceEvaluationDto } from './dto/create-performance-evaluation.dto';
import { UpdatePerformanceEvaluationDto } from './dto/update-performance-evaluation.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Opções de listagem — quando não-global, filtra pelas avaliações do próprio criador. */
export interface ListScope {
  isGlobal: boolean;
  userId: string | null;
}

/** Normaliza as respostas garantindo justificativa como string. */
function normalizeAnswers(dto: SubmitAnswersDto): PerformanceAnswer[] {
  return dto.answers.map((a) => ({
    competenciaId: a.competenciaId,
    valor: a.valor,
    justificativa: a.justificativa ?? '',
  }));
}

@Injectable()
export class PerformanceEvaluationsService {
  constructor(
    @InjectRepository(PerformanceEvaluationEntity)
    private readonly repo: Repository<PerformanceEvaluationEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    tenantSlug: string,
    dto: CreatePerformanceEvaluationDto,
    createdByUserId: string | null,
    ctx?: AuditContext,
  ): Promise<PerformanceEvaluationEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const base = toSlug(dto.colaboradorNome);
    const dateSuffix = (dto.dataAvaliacao ?? '').replace(/-/g, '').slice(0, 8);
    let candidate = dateSuffix ? `${base}-${dateSuffix}` : base;
    const existing = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (existing) {
      candidate = `${candidate}-${Date.now().toString(36)}`;
    }

    const evaluation = this.repo.create({
      ...dto,
      projeto: dto.projeto ?? '',
      tenantId,
      slug: candidate,
      createdByUserId,
      status: 'pendente',
    });
    const saved = await this.repo.save(evaluation);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PERFORMANCE_EVALUATION_CREATED',
      'performance_evaluation',
      saved.id,
      { colaboradorNome: dto.colaboradorNome, dataAvaliacao: dto.dataAvaliacao },
    );

    return saved;
  }

  async findAll(
    tenantSlug: string,
    scope: ListScope,
  ): Promise<PerformanceEvaluationEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const where = scope.isGlobal
      ? { tenantId }
      : { tenantId, createdByUserId: scope.userId ?? undefined };
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findBySlug(
    tenantSlug: string,
    slug: string,
  ): Promise<PerformanceEvaluationEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const evaluation = await this.repo.findOne({ where: { tenantId, slug } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    return evaluation;
  }

  async update(
    tenantSlug: string,
    slug: string,
    dto: UpdatePerformanceEvaluationDto,
    ctx?: AuditContext,
  ): Promise<PerformanceEvaluationEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const evaluation = await this.repo.findOne({ where: { tenantId, slug } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');

    Object.assign(evaluation, dto);
    const saved = await this.repo.save(evaluation);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PERFORMANCE_EVALUATION_UPDATED',
      'performance_evaluation',
      evaluation.id,
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
    const evaluation = await this.repo.findOne({ where: { tenantId, slug } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    await this.repo.remove(evaluation);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PERFORMANCE_EVALUATION_DELETED',
      'performance_evaluation',
      evaluation.id,
      { colaboradorNome: evaluation.colaboradorNome },
    );

    return { deleted: 1 };
  }

  /**
   * Submete a avaliação do gestor (primeira etapa do fluxo).
   * Permitida enquanto a avaliação não estiver concluída.
   */
  async submitManager(
    tenantSlug: string,
    slug: string,
    dto: SubmitAnswersDto,
    ctx?: AuditContext,
  ): Promise<PerformanceEvaluationEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const evaluation = await this.repo.findOne({ where: { tenantId, slug } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    if (!evaluation.active) throw new BadRequestException('Esta avaliação está inativa');
    if (evaluation.status === 'concluida') {
      throw new BadRequestException('Esta avaliação já foi concluída');
    }

    evaluation.managerAnswers = normalizeAnswers(dto);
    evaluation.managerSubmittedAt = new Date();
    evaluation.status = 'aguardando_colaborador';
    const saved = await this.repo.save(evaluation);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PERFORMANCE_EVALUATION_MANAGER_SUBMITTED',
      'performance_evaluation',
      evaluation.id,
      {},
    );

    return saved;
  }

  /**
   * Submete a autoavaliação do colaborador (segunda etapa).
   * Só é permitida após o gestor ter respondido.
   */
  async submitSelf(
    tenantSlug: string,
    slug: string,
    dto: SubmitAnswersDto,
    ctx?: AuditContext,
  ): Promise<PerformanceEvaluationEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const evaluation = await this.repo.findOne({ where: { tenantId, slug } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    if (!evaluation.active) throw new BadRequestException('Esta avaliação está inativa');
    if (evaluation.status === 'pendente') {
      throw new BadRequestException('Aguarde a avaliação do gestor antes de preencher a autoavaliação');
    }
    if (evaluation.status === 'concluida') {
      throw new BadRequestException('Esta avaliação já foi concluída');
    }

    evaluation.selfAnswers = normalizeAnswers(dto);
    evaluation.selfSubmittedAt = new Date();
    evaluation.status = 'concluida';
    const saved = await this.repo.save(evaluation);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PERFORMANCE_EVALUATION_SELF_SUBMITTED',
      'performance_evaluation',
      evaluation.id,
      {},
    );

    return saved;
  }
}
