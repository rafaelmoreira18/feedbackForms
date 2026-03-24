import type { Form3Response, Form3Filters, Form3Metrics, PaginatedResponse } from '../types'
import { api } from './api'

function buildQueryString(filters?: Form3Filters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.sortSatisfaction) params.set('sortSatisfaction', filters.sortSatisfaction)
  if (filters.formType) params.set('formType', filters.formType)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const formResponseService = {
  getAll: async (tenantSlug: string): Promise<Form3Response[]> => {
    const res = await api.get<Form3Response[] | PaginatedResponse<Form3Response>>(
      `feedback/form-responses?tenantSlug=${tenantSlug}`,
    )
    const data = res.data
    return Array.isArray(data) ? data : data.data
  },

  getPaginated: async (
    tenantSlug: string,
    filters?: Form3Filters,
  ): Promise<PaginatedResponse<Form3Response>> => {
    const qs = buildQueryString(filters)
    const res = await api.get<Form3Response[] | PaginatedResponse<Form3Response>>(
      `feedback/form-responses?tenantSlug=${tenantSlug}${qs ? '&' + qs.slice(1) : ''}`,
    )
    const data = res.data
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, limit: data.length }
    }
    return data
  },

  getById: async (tenantSlug: string, id: string): Promise<Form3Response> => {
    const res = await api.get<Form3Response>(`feedback/form-responses/${id}?tenantSlug=${tenantSlug}`)
    return res.data
  },

  submit: async (
    tenantSlug: string,
    formData: Omit<Form3Response, 'id' | 'createdAt'>,
  ): Promise<Form3Response> => {
    const res = await api.post<Form3Response>('feedback/form-responses', { ...formData, tenantSlug })
    return res.data
  },

  getMetrics: async (tenantSlug: string, filters?: Form3Filters): Promise<Form3Metrics> => {
    const qs = buildQueryString(filters)
    const res = await api.get<Form3Metrics>(
      `feedback/form-responses/metrics?tenantSlug=${tenantSlug}${qs ? '&' + qs.slice(1) : ''}`,
    )
    return res.data
  },

  getFormTemplates: async (tenantSlug: string) => {
    const res = await api.get<import('../types').FormTemplate[]>(
      `feedback/form-templates?tenantSlug=${tenantSlug}`,
    )
    return res.data
  },

  getFormTemplate: async (tenantSlug: string, formSlug: string) => {
    const res = await api.get<import('../types').FormTemplate>(
      `feedback/form-templates/${formSlug}?tenantSlug=${tenantSlug}`,
    )
    return res.data
  },
}
