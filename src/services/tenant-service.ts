import type { Tenant, FormTemplate } from '../types';
import { api } from './api';

export const tenantService = {
  getBySlug: async (slug: string): Promise<Tenant> => {
    return api.get<Tenant>(`tenants/${slug}`);
  },

  getFormTemplates: async (tenantSlug: string): Promise<FormTemplate[]> => {
    return api.get<FormTemplate[]>(`tenants/${tenantSlug}/form-templates`);
  },

  getFormTemplate: async (tenantSlug: string, formSlug: string): Promise<FormTemplate> => {
    return api.get<FormTemplate>(`tenants/${tenantSlug}/form-templates/${formSlug}`);
  },
};
