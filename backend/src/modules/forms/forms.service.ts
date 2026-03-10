import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form3ResponseEntity, Form3Response } from './forms.entity';
import { FormTemplateEntity } from '../form-templates/form-template.entity';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';

@Injectable()
export class Form3Service {
  constructor(
    @InjectRepository(Form3ResponseEntity)
    private readonly repo: Repository<Form3ResponseEntity>,
    @InjectRepository(FormTemplateEntity)
    private readonly templateRepo: Repository<FormTemplateEntity>,
  ) {}

  async create(tenantId: string, dto: CreateForm3Dto): Promise<Form3Response> {
    const template = await this.templateRepo.findOne({
      where: { tenantId, slug: dto.formType, active: true },
    });
    if (!template) {
      throw new BadRequestException(
        `Formulário '${dto.formType}' não encontrado ou inativo para este tenant`,
      );
    }
    const form = this.repo.create({ ...dto, tenantId, comments: dto.comments ?? '' });
    return this.repo.save(form);
  }

  async findAll(
    tenantId: string,
    filters?: FilterForm3Dto,
  ): Promise<{ data: Form3Response[]; total: number; page: number; limit: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.repo.createQueryBuilder('form');
    qb.where('form.tenantId = :tenantId', { tenantId });

    if (filters?.startDate) {
      qb.andWhere('form.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      qb.andWhere('form.createdAt <= :endDate', {
        endDate: filters.endDate + 'T23:59:59',
      });
    }
    if (filters?.formType) {
      qb.andWhere('form.formType = :formType', { formType: filters.formType });
    }
    if (filters?.sortSatisfaction) {
      const direction = filters.sortSatisfaction === 'desc' ? 'DESC' : 'ASC';
      qb.addSelect(
        `(
          SELECT AVG((elem->>'value')::float)
          FROM jsonb_array_elements(form.answers) AS elem
          WHERE elem->>'questionId' != 'nps'
        )`,
        'avg_score',
      );
      qb.orderBy('avg_score', direction);
    } else {
      qb.orderBy('form.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<Form3Response> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

  /** Soft-delete a single response. Only deletes if it belongs to the tenant. */
  async softDeleteOne(tenantId: string, id: string): Promise<{ deleted: number }> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    await this.repo.softDelete(id);
    return { deleted: 1 };
  }

  /** Hard-delete all responses for a tenant (bulk wipe — requires holding_admin or hospital_admin). */
  async deleteAll(tenantId: string): Promise<{ deleted: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(Form3ResponseEntity)
      .where('tenantId = :tenantId', { tenantId })
      .execute();
    return { deleted: result.affected ?? 0 };
  }

  async getMetrics(tenantId: string, filters?: FilterForm3Dto) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Base filter query builder (reused for all aggregations)
    const buildBase = () => {
      const qb = this.repo.createQueryBuilder('form');
      qb.where('form.tenantId = :tenantId', { tenantId });
      if (filters?.startDate) {
        qb.andWhere('form.createdAt >= :startDate', { startDate: filters.startDate });
      }
      if (filters?.endDate) {
        qb.andWhere('form.createdAt <= :endDate', {
          endDate: filters.endDate + 'T23:59:59',
        });
      }
      if (filters?.formType) {
        qb.andWhere('form.formType = :formType', { formType: filters.formType });
      }
      return qb;
    };

    // All aggregations in a single SQL query
    const row = await buildBase()
      .select('COUNT(*)', 'totalResponses')
      .addSelect(
        `AVG(
          (SELECT AVG((elem->>'value')::float)
           FROM jsonb_array_elements(form.answers) AS elem
           WHERE elem->>'questionId' != 'nps')
        )`,
        'avgSatisfaction',
      )
      .addSelect(
        `AVG(
          (SELECT (elem->>'value')::float
           FROM jsonb_array_elements(form.answers) AS elem
           WHERE elem->>'questionId' = 'nps'
           LIMIT 1)
        )`,
        'avgNps',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE form.createdAt >= :thisMonthStart)`,
        'responsesThisMonth',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE form.createdAt >= :lastMonthStart AND form.createdAt <= :lastMonthEnd)`,
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
      averageNps: Math.round((parseFloat(row?.avgNps ?? '0') || 0) * 10) / 10,
      responsesThisMonth: parseInt(row?.responsesThisMonth ?? '0', 10),
      responsesLastMonth: parseInt(row?.responsesLastMonth ?? '0', 10),
    };
  }
}
