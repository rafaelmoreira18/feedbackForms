import type { Form3Response, Form3Filters, Form3Metrics, PaginatedResponse } from '../types';
import { api } from './api';

export { getScaleAverage, getNpsScore } from './analytics3-service';

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

export const form3Service = {
  // Returns all records for analytics. Unwraps paginated envelope.
  getAll: async (tenantSlug: string): Promise<Form3Response[]> => {
    const res = await api.get<PaginatedResponse<Form3Response>>(
      `tenants/${tenantSlug}/forms3`,
    );
    return res.data;
  },

  // Returns filtered list for dashboard table.
  getPaginated: async (
    tenantSlug: string,
    filters?: Form3Filters,
  ): Promise<PaginatedResponse<Form3Response>> => {
    const qs = buildQueryString(filters);
    return api.get<PaginatedResponse<Form3Response>>(`tenants/${tenantSlug}/forms3${qs}`);
  },

  getById: async (tenantSlug: string, id: string): Promise<Form3Response> => {
    return api.get<Form3Response>(`tenants/${tenantSlug}/forms3/${id}`);
  },

  create: async (
    tenantSlug: string,
    formData: Omit<Form3Response, 'id' | 'createdAt'>,
  ): Promise<Form3Response> => {
    return api.post<Form3Response>(`tenants/${tenantSlug}/forms3`, formData);
  },

  getMetrics: async (tenantSlug: string, filters?: Form3Filters): Promise<Form3Metrics> => {
    const qs = buildQueryString(filters);
    return api.get<Form3Metrics>(`tenants/${tenantSlug}/forms3/metrics${qs}`);
  },
};
