import type { Tenant, FormTemplate } from '@/types'
import { api } from './api'

export const tenantService = {
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
