import type { Form3Response, Form3Filters, Form3Metrics } from '../types';
import { api } from './api';

function buildQueryString(filters?: Form3Filters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.sortSatisfaction) params.set('sortSatisfaction', filters.sortSatisfaction);
  if (filters.formType) params.set('formType', filters.formType);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function getScaleAverage(form: Form3Response): number {
  const scaleAnswers = form.answers.filter((a) => a.questionId !== 'nps');
  if (scaleAnswers.length === 0) return 0;
  return scaleAnswers.reduce((sum, a) => sum + a.value, 0) / scaleAnswers.length;
}

export function getNpsScore(form: Form3Response): number | undefined {
  const npsAnswer = form.answers.find((a) => a.questionId === 'nps');
  return npsAnswer?.value;
}

export const form3Service = {
  getAll: async (): Promise<Form3Response[]> => {
    return api.get<Form3Response[]>('forms3');
  },

  getById: async (id: string): Promise<Form3Response> => {
    return api.get<Form3Response>(`forms3/${id}`);
  },

  create: async (formData: Omit<Form3Response, 'id' | 'createdAt'>): Promise<Form3Response> => {
    return api.post<Form3Response>('forms3', formData);
  },

  filter: async (filters: Form3Filters): Promise<Form3Response[]> => {
    const qs = buildQueryString(filters);
    return api.get<Form3Response[]>(`forms3${qs}`);
  },

  getMetrics: async (filters?: Form3Filters): Promise<Form3Metrics> => {
    const qs = buildQueryString(filters);
    return api.get<Form3Metrics>(`forms3/metrics${qs}`);
  },

  getScaleAverage,
};
