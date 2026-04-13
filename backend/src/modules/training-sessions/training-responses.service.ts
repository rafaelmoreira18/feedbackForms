import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingResponseEntity } from './training-response.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreateTrainingResponseDto } from './dto/create-training-response.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';

export interface TrainingMetrics {
  totalResponses: number;
  averageSatisfaction: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
  /** Percentage that recommended (recomenda === true), null if not applicable */
  averageNps: number;
}

@Injectable()
export class TrainingResponsesService {
  constructor(
    @InjectRepository(TrainingResponseEntity)
    private readonly repo: Repository<TrainingResponseEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionRepo: Repository<TrainingSessionEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantSlug: string, dto: CreateTrainingResponseDto, ctx?: AuditContext): Promise<TrainingResponseEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const session = await this.sessionRepo.findOne({
      where: { tenantId, slug: dto.sessionSlug },
    });
    if (!session) {
      throw new BadRequestException(`Treinamento '${dto.sessionSlug}' não encontrado`);
    }
    if (!session.active) {
      throw new BadRequestException('Este link de treinamento está inativo');
    }

    const response = this.repo.create({
      tenantId,
      sessionId: session.id,
      respondentName: dto.respondentName ?? 'Anônimo',
      answers: dto.answers,
      pontoAlto: dto.pointoAlto ?? '',
      jaAplica: dto.jaAplica ?? '',
      recomenda: dto.recomenda ?? null,
      recomendaMotivo: dto.recomendaMotivo ?? '',
      comments: dto.comments ?? '',
    });

    const saved = await this.repo.save(response);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'TRAINING_RESPONSE_CREATED',
      'training_response',
      saved.id,
      { sessionId: session.id, sessionSlug: dto.sessionSlug },
    );

    return saved;
  }

  async findAll(
    tenantSlug: string,
    sessionSlug?: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<{ data: TrainingResponseEntity[]; total: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const qb = this.repo
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.session', 'session')
      .where('tr.tenantId = :tenantId', { tenantId });

    if (sessionSlug) {
      const session = await this.sessionRepo.findOne({ where: { tenantId, slug: sessionSlug } });
      if (session) qb.andWhere('tr.sessionId = :sessionId', { sessionId: session.id });
    }

    if (filters?.startDate) {
      qb.andWhere('tr.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      qb.andWhere('tr.createdAt <= :endDate', {
        endDate: filters.endDate + 'T23:59:59',
      });
    }

    qb.orderBy('tr.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(tenantSlug: string, id: string): Promise<TrainingResponseEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const response = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['session'],
    });
    if (!response) throw new NotFoundException('Resposta não encontrada');
    return response;
  }

  async softDelete(tenantSlug: string, id: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const response = await this.repo.findOne({ where: { id, tenantId } });
    if (!response) throw new NotFoundException('Resposta não encontrada');
    await this.repo.softDelete(id);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'TRAINING_RESPONSE_DELETED',
      'training_response',
      id,
    );

    return { deleted: 1 };
  }

  async getMetrics(
    tenantSlug: string,
    sessionSlug?: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<TrainingMetrics> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const buildBase = () => {
      const qb = this.repo.createQueryBuilder('tr').where('tr.tenantId = :tenantId', { tenantId });
      if (sessionSlug) {
        // Subquery: get session id by slug
        qb.andWhere(
          `tr.sessionId = (SELECT id FROM training_sessions WHERE "tenantId" = :tenantId AND slug = :sessionSlug LIMIT 1)`,
          { sessionSlug },
        );
      }
      if (filters?.startDate) qb.andWhere('tr.createdAt >= :startDate', { startDate: filters.startDate });
      if (filters?.endDate)
        qb.andWhere('tr.createdAt <= :endDate', { endDate: filters.endDate + 'T23:59:59' });
      return qb;
    };

    const row = await buildBase()
      .select('COUNT(*)', 'totalResponses')
      .addSelect(
        `AVG(
          (SELECT AVG((elem->>'value')::float)
           FROM jsonb_array_elements(tr.answers) AS elem)
        )`,
        'avgSatisfaction',
      )
      .addSelect(
        `CASE WHEN COUNT(*) FILTER (WHERE tr.recomenda IS NOT NULL) = 0 THEN NULL
         ELSE ROUND(
           100.0 * COUNT(*) FILTER (WHERE tr.recomenda = true)
           / NULLIF(COUNT(*) FILTER (WHERE tr.recomenda IS NOT NULL), 0)
         , 1)
        END`,
        'avgNps',
      )
      .addSelect(`COUNT(*) FILTER (WHERE tr.createdAt >= :thisMonthStart)`, 'responsesThisMonth')
      .addSelect(
        `COUNT(*) FILTER (WHERE tr.createdAt >= :lastMonthStart AND tr.createdAt <= :lastMonthEnd)`,
        'responsesLastMonth',
      )
      .setParameter('thisMonthStart', thisMonthStart)
      .setParameter('lastMonthStart', lastMonthStart)
      .setParameter('lastMonthEnd', lastMonthEnd)
      .getRawOne<{
        totalResponses: string;
        avgSatisfaction: string | null;
        avgNps: string | null;
        responsesThisMonth: string;
        responsesLastMonth: string;
      }>();

    return {
      totalResponses: parseInt(row?.totalResponses ?? '0', 10),
      averageSatisfaction: Math.round((parseFloat(row?.avgSatisfaction ?? '0') || 0) * 10) / 10,
      averageNps: parseFloat(row?.avgNps ?? '0') || 0,
      responsesThisMonth: parseInt(row?.responsesThisMonth ?? '0', 10),
      responsesLastMonth: parseInt(row?.responsesLastMonth ?? '0', 10),
    };
  }
}
