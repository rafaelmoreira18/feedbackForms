import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from './form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { FilterFormDto } from './dto/filter-form.dto';

@Injectable()
export class FormService {
  private forms: FormResponse[] = [];

  create(dto: CreateFormDto): FormResponse {
    const form: FormResponse = {
      ...dto,
      comments: dto.comments ?? '',
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    this.forms.push(form);
    return form;
  }

  findAll(filters?: FilterFormDto): FormResponse[] {
    let results = [...this.forms];

    if (filters?.startDate) {
      results = results.filter((f) => f.createdAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      results = results.filter(
        (f) => f.createdAt <= filters.endDate! + 'T23:59:59',
      );
    }

    if (filters?.department) {
      results = results.filter((f) => f.department === filters.department);
    }

    if (filters?.sortSatisfaction) {
      results.sort((a, b) =>
        filters.sortSatisfaction === 'desc'
          ? this.getAverage(b) - this.getAverage(a)
          : this.getAverage(a) - this.getAverage(b),
      );
    }

    return results;
  }

  findById(id: string): FormResponse {
    const form = this.forms.find((f) => f.id === id);
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

  getMetrics(filters?: FilterFormDto) {
    const forms = this.findAll(filters);
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
      (f) => f.satisfaction.wouldRecommend >= 4,
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
