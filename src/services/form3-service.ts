import type { Form3Response, Form3Filters, Form3Metrics, PaginatedResponse, CpfJustificativa } from '@/types'
import { api } from './api'

export { getScaleAverage, getNpsScore } from './analytics3-service'

function buildQueryString(filters?: Form3Filters & { limit?: number }): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.sortSatisfaction) params.set('sortSatisfaction', filters.sortSatisfaction)
  if (filters.formType) params.set('formType', filters.formType)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
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
    formData: Omit<Form3Response, 'id' | 'createdAt' | 'cpfAddedAt'> & { cpfJustificativa?: CpfJustificativa },
  ): Promise<Form3Response> => {
    const res = await api.post<Form3Response>(`tenants/${tenantSlug}/forms3`, formData)
    return res.data
  },

  updateCpf: async (tenantSlug: string, id: string, patientCpf: string): Promise<Form3Response> => {
    const res = await api.patch<Form3Response>(`tenants/${tenantSlug}/forms3/${id}/cpf`, { patientCpf })
    return res.data
  },

  getAllForReport: async (tenantSlug: string, filters?: Form3Filters): Promise<Form3Response[]> => {
    const PAGE_SIZE = 200
    const firstQs = buildQueryString({ ...filters, page: 1, limit: PAGE_SIZE })
    const firstRes = await api.get<Form3Response[] | PaginatedResponse<Form3Response>>(
      `tenants/${tenantSlug}/forms3${firstQs}`,
    )
    if (Array.isArray(firstRes.data)) return firstRes.data
    const { data, total } = firstRes.data
    if (total <= PAGE_SIZE) return data
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map(async (p) => {
        const qs = buildQueryString({ ...filters, page: p, limit: PAGE_SIZE })
        const res = await api.get<PaginatedResponse<Form3Response>>(`tenants/${tenantSlug}/forms3${qs}`)
        return res.data.data
      }),
    )
    return [...data, ...remaining.flat()]
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
