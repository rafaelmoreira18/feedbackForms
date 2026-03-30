import type { Form3Response, Form3Filters, Form3Metrics, PaginatedResponse } from '@/types'
import { api } from './api'

export { getScaleAverage, getNpsScore } from './analytics3-service'

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

export const form3Service = {
  getAll: async (tenantSlug: string): Promise<Form3Response[]> => {
    const res = await api.get<Form3Response[] | PaginatedResponse<Form3Response>>(
      `tenants/${tenantSlug}/forms3`,
    )
    return Array.isArray(res.data) ? res.data : res.data.data
  },

  getPaginated: async (
    tenantSlug: string,
    filters?: Form3Filters,
  ): Promise<PaginatedResponse<Form3Response>> => {
    const qs = buildQueryString(filters)
    const res = await api.get<Form3Response[] | PaginatedResponse<Form3Response>>(
      `tenants/${tenantSlug}/forms3${qs}`,
    )
    if (Array.isArray(res.data)) {
      return { data: res.data, total: res.data.length, page: 1, limit: res.data.length }
    }
    return res.data
  },

  getById: async (tenantSlug: string, id: string): Promise<Form3Response> => {
    const res = await api.get<Form3Response>(`tenants/${tenantSlug}/forms3/${id}`)
    return res.data
  },

  create: async (
    tenantSlug: string,
    formData: Omit<Form3Response, 'id' | 'createdAt'>,
  ): Promise<Form3Response> => {
    const res = await api.post<Form3Response>(`tenants/${tenantSlug}/forms3`, formData)
    return res.data
  },

  getMetrics: async (tenantSlug: string, filters?: Form3Filters): Promise<Form3Metrics> => {
    const qs = buildQueryString(filters)
    const res = await api.get<Form3Metrics>(`tenants/${tenantSlug}/forms3/metrics${qs}`)
    return res.data
  },

  deleteOne: async (tenantSlug: string, id: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/forms3/${id}`)
  },
}
