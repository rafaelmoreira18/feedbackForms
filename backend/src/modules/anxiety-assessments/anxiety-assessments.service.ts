import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnxietyAssessmentEntity } from './anxiety-assessment.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreateAnxietyAssessmentDto } from './dto/create-anxiety-assessment.dto';
import { UpdateAnxietyAssessmentDto } from './dto/update-anxiety-assessment.dto';
import { SubmitAnxietyAnswersDto } from './dto/submit-anxiety-answers.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';
import { scoreAnxiety, ANXIETY_ITEM_COUNT } from './anxiety-scoring';
import { toSlug } from '../../common/utils/slug.util';

/**
 * Projeção pública (link do colaborador): NÃO expõe escores, classificação
 * ou respostas — apenas o cabeçalho e quais questionários ainda faltam.
 */
export interface AnxietyAssessmentPublicView {
  slug: string;
  colaboradorNome: string;
  cargo: string;
  setor: string;
  dataAplicacao: string;
  active: boolean;
  baiPendente: boolean;
  gad7Pendente: boolean;
}

@Injectable()
export class AnxietyAssessmentsService {
  constructor(
    @InjectRepository(AnxietyAssessmentEntity)
    private readonly repo: Repository<AnxietyAssessmentEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Cria uma aplicação por colaborador + data. Provisiona os DOIS instrumentos
   * (BAI e GAD-7) de uma vez, ambos vazios, prontos para serem respondidos.
   */
  async create(
    tenantSlug: string,
    dto: CreateAnxietyAssessmentDto,
    ctx?: AuditContext,
  ): Promise<AnxietyAssessmentEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const base = toSlug(dto.colaboradorNome);
    const dateSuffix = dto.dataAplicacao.replace(/-/g, '').slice(0, 8);
    let candidate = `${base}-${dateSuffix}`;
    const existing = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (existing) {
      candidate = `${candidate}-${Date.now().toString(36)}`;
    }

    const assessment = this.repo.create({
      tenantId,
      createdByUserId: ctx?.userId ?? null,
      slug: candidate,
      colaboradorNome: dto.colaboradorNome,
      cargo: dto.cargo ?? '',
      setor: dto.setor ?? '',
      dataAplicacao: dto.dataAplicacao,
      active: true,
    });
    const saved = await this.repo.save(assessment);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'ANXIETY_ASSESSMENT_CREATED',
      'anxiety_assessment',
      saved.id,
      { colaboradorNome: dto.colaboradorNome, dataAplicacao: dto.dataAplicacao },
    );

    return saved;
  }

  /** Lista todas as aplicações do tenant (uso interno do RH). */
  async findAll(tenantSlug: string): Promise<AnxietyAssessmentEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Busca completa por slug (uso interno do RH). */
  async findBySlug(tenantSlug: string, slug: string): Promise<AnxietyAssessmentEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const assessment = await this.repo.findOne({ where: { tenantId, slug } });
    if (!assessment) throw new NotFoundException('Avaliação não encontrada');
    return assessment;
  }

  /** Projeção pública (link do colaborador) — sem escores/respostas. */
  private toPublicView(a: AnxietyAssessmentEntity): AnxietyAssessmentPublicView {
    return {
      slug: a.slug,
      colaboradorNome: a.colaboradorNome,
      cargo: a.cargo,
      setor: a.setor,
      dataAplicacao: a.dataAplicacao,
      active: a.active,
      baiPendente: a.baiRespondidoEm === null,
      gad7Pendente: a.gad7RespondidoEm === null,
    };
  }

  /** Projeção pública para o link do colaborador — sem escores/respostas. */
  async findPublic(tenantSlug: string, slug: string): Promise<AnxietyAssessmentPublicView> {
    const a = await this.findBySlug(tenantSlug, slug);
    return this.toPublicView(a);
  }

  /**
   * Submissão pública de um dos instrumentos. Calcula o escore total e a
   * classificação de gravidade. Cada instrumento só pode ser respondido uma vez.
   */
  async submit(
    tenantSlug: string,
    slug: string,
    dto: SubmitAnxietyAnswersDto,
    ctx?: Pick<AuditContext, 'ipAddress'>,
  ): Promise<AnxietyAssessmentPublicView> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const assessment = await this.repo.findOne({ where: { tenantId, slug } });
    if (!assessment) throw new NotFoundException('Avaliação não encontrada');
    if (!assessment.active) throw new BadRequestException('Este link está inativo');

    const expected = ANXIETY_ITEM_COUNT[dto.instrument];
    if (dto.answers.length !== expected) {
      throw new BadRequestException(
        `O instrumento ${dto.instrument.toUpperCase()} requer exatamente ${expected} respostas`,
      );
    }
    const itemIds = new Set(dto.answers.map((a) => a.itemId));
    if (itemIds.size !== expected) {
      throw new BadRequestException('Há itens duplicados ou faltantes nas respostas');
    }
    if (dto.answers.some((a) => a.itemId > expected)) {
      throw new BadRequestException(`Item fora do intervalo para ${dto.instrument.toUpperCase()}`);
    }

    const alreadyAnswered =
      dto.instrument === 'bai' ? assessment.baiRespondidoEm : assessment.gad7RespondidoEm;
    if (alreadyAnswered) {
      throw new ConflictException('Este questionário já foi respondido');
    }

    const { escore, classificacao } = scoreAnxiety(dto.instrument, dto.answers);
    const now = new Date();
    if (dto.instrument === 'bai') {
      assessment.baiRespostas = dto.answers;
      assessment.baiEscore = escore;
      assessment.baiClassificacao = classificacao;
      assessment.baiRespondidoEm = now;
    } else {
      assessment.gad7Respostas = dto.answers;
      assessment.gad7Escore = escore;
      assessment.gad7Classificacao = classificacao;
      assessment.gad7RespondidoEm = now;
    }

    const saved = await this.repo.save(assessment);

    await this.auditLog.record(
      { tenantId, ipAddress: ctx?.ipAddress ?? null },
      'ANXIETY_ASSESSMENT_SUBMITTED',
      'anxiety_assessment',
      saved.id,
      { instrument: dto.instrument, escore, classificacao },
    );

    return this.toPublicView(saved);
  }

  /** Edita cabeçalho e/ou liga-desliga o link público. */
  async update(
    tenantSlug: string,
    slug: string,
    dto: UpdateAnxietyAssessmentDto,
    ctx?: AuditContext,
  ): Promise<AnxietyAssessmentEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const assessment = await this.repo.findOne({ where: { tenantId, slug } });
    if (!assessment) throw new NotFoundException('Avaliação não encontrada');

    Object.assign(assessment, dto);
    const saved = await this.repo.save(assessment);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'ANXIETY_ASSESSMENT_UPDATED',
      'anxiety_assessment',
      saved.id,
      { changes: dto },
    );

    return saved;
  }

  async remove(tenantSlug: string, slug: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const assessment = await this.repo.findOne({ where: { tenantId, slug } });
    if (!assessment) throw new NotFoundException('Avaliação não encontrada');
    await this.repo.remove(assessment);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'ANXIETY_ASSESSMENT_DELETED',
      'anxiety_assessment',
      assessment.id,
      { colaboradorNome: assessment.colaboradorNome },
    );

    return { deleted: 1 };
  }
}
