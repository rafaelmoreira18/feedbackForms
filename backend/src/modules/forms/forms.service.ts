import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form3ResponseEntity, Form3Response } from './forms.entity';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';

@Injectable()
export class Form3Service {
  constructor(
    @InjectRepository(Form3ResponseEntity)
    private readonly repo: Repository<Form3ResponseEntity>,
  ) {}

  async create(tenantId: string, dto: CreateForm3Dto): Promise<Form3Response> {
    const form = this.repo.create({ ...dto, tenantId, comments: dto.comments ?? '' });
    return this.repo.save(form);
  }

  async findAll(tenantId: string, filters?: FilterForm3Dto): Promise<Form3Response[]> {
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
    }

    return qb.getMany();
  }

  async findById(tenantId: string, id: string): Promise<Form3Response> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

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
    const forms = await this.findAll(tenantId, filters);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const responsesThisMonth = forms.filter(
      (f) => new Date(f.createdAt) >= thisMonthStart,
    ).length;

    const responsesLastMonth = forms.filter(
      (f) =>
        new Date(f.createdAt) >= lastMonthStart &&
        new Date(f.createdAt) <= lastMonthEnd,
    ).length;

    const avgSatisfaction =
      forms.length > 0
        ? forms.reduce((sum, f) => sum + this.getScaleAverage(f), 0) / forms.length
        : 0;

    const npsScores = forms
      .map((f) => f.answers.find((a) => a.questionId === 'nps')?.value)
      .filter((v): v is number => v !== undefined);

    const avgNps =
      npsScores.length > 0
        ? npsScores.reduce((s, v) => s + v, 0) / npsScores.length
        : 0;

    return {
      totalResponses: forms.length,
      averageSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      responsesThisMonth,
      responsesLastMonth,
      averageNps: Math.round(avgNps * 10) / 10,
    };
  }

  private getScaleAverage(form: Form3Response): number {
    const scaleAnswers = form.answers.filter((a) => a.questionId !== 'nps');
    if (scaleAnswers.length === 0) return 0;
    return scaleAnswers.reduce((sum, a) => sum + a.value, 0) / scaleAnswers.length;
  }
}
