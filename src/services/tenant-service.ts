import type { Tenant, FormTemplate } from '@/types'
import { api } from './api'

export const tenantService = {
  getAll: async (): Promise<Tenant[]> => {
    const res = await api.get<Tenant[]>('tenants')
    return res.data
  },

  /** Returns all active tenants including sede/matriz (no hasFeedbackForms filter) — for /treinamentos */
  getAllActive: async (): Promise<Tenant[]> => {
    const res = await api.get<Tenant[]>('tenants/all-active')
    return res.data
  },

  getBySlug: async (slug: string): Promise<Tenant> => {
    const res = await api.get<Tenant>(`tenants/${slug}`)
    return res.data
  },

  getFormTemplates: async (tenantSlug: string): Promise<FormTemplate[]> => {
    const res = await api.get<FormTemplate[]>(`tenants/${tenantSlug}/form-templates`)
    return res.data
  },

  getFormTemplate: async (tenantSlug: string, formSlug: string): Promise<FormTemplate> => {
    const res = await api.get<FormTemplate>(`tenants/${tenantSlug}/form-templates/${formSlug}`)
    return res.data
  },
}
