import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormResponseEntity, FormResponse } from './form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { FilterFormDto } from './dto/filter-form.dto';

@Injectable()
export class FormService {
  constructor(
    @InjectRepository(FormResponseEntity)
    private readonly formRepository: Repository<FormResponseEntity>,
  ) {}

  async create(dto: CreateFormDto): Promise<FormResponse> {
    const form = this.formRepository.create({
      ...dto,
      comments: dto.comments ?? '',
    });
    return this.formRepository.save(form);
  }

  async findAll(filters?: FilterFormDto): Promise<FormResponse[]> {
    const qb = this.formRepository.createQueryBuilder('form');

    if (filters?.startDate) {
      qb.andWhere('form.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere('form.createdAt <= :endDate', {
        endDate: filters.endDate + 'T23:59:59',
      });
    }

    if (filters?.evaluatedDepartment) {
      qb.andWhere('form.evaluatedDepartment = :evaluatedDepartment', {
        evaluatedDepartment: filters.evaluatedDepartment,
      });
    }

    if (filters?.sortSatisfaction) {
      const direction = filters.sortSatisfaction === 'desc' ? 'DESC' : 'ASC';
      qb.addSelect(
        `(
          (form.satisfaction->>'overallCare')::float +
          (form.satisfaction->>'nursingCare')::float +
          (form.satisfaction->>'medicalCare')::float +
          (form.satisfaction->>'welcoming')::float +
          (form.satisfaction->>'cleanliness')::float +
          (form.satisfaction->>'comfort')::float +
          (form.satisfaction->>'responseTime')::float +
          (form.satisfaction->>'overallSatisfaction')::float
        ) / 8.0`,
        'avg_satisfaction',
      );
      qb.orderBy('avg_satisfaction', direction);
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<FormResponse> {
    const form = await this.formRepository.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

  async getMetrics(filters?: FilterFormDto) {
    const forms = await this.findAll(filters);
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
        ? forms.reduce((sum, f) => sum + this.getAverage(f), 0) / forms.length
        : 0;

    const recommendCount = forms.filter(
      (f) => f.experience.wouldRecommend === true,
    ).length;

    const recommendationRate =
      forms.length > 0 ? (recommendCount / forms.length) * 100 : 0;

    return {
      totalResponses: forms.length,
      averageSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      recommendationRate: Math.round(recommendationRate * 10) / 10,
      responsesThisMonth,
      responsesLastMonth,
    };
  }

  private getAverage(form: FormResponse): number {
    const values = Object.values(form.satisfaction) as number[];
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}
