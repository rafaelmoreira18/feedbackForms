import type {
  Pdi,
  PdiAction,
  CreatePdiDto,
} from '@/types'
import { api } from './api'
import { mockPdiService } from './pdi-service.mock'

const apiPdiService = {
  getAll: async (tenantSlug: string): Promise<Pdi[]> => {
    const res = await api.get<Pdi[]>(`tenants/${tenantSlug}/performance-development-plans`)
    return res.data
  },

  getOne: async (tenantSlug: string, slug: string): Promise<Pdi> => {
    const res = await api.get<Pdi>(
      `tenants/${tenantSlug}/performance-development-plans/${slug}`,
    )
    return res.data
  },

  create: async (tenantSlug: string, dto: CreatePdiDto): Promise<Pdi> => {
    const res = await api.post<Pdi>(
      `tenants/${tenantSlug}/performance-development-plans`,
      dto,
    )
    return res.data
  },

  update: async (
    tenantSlug: string,
    slug: string,
    dto: Partial<{ active: boolean }>,
  ): Promise<Pdi> => {
    const res = await api.patch<Pdi>(
      `tenants/${tenantSlug}/performance-development-plans/${slug}`,
      dto,
    )
    return res.data
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/performance-development-plans/${slug}`)
  },

  submitManager: async (
    tenantSlug: string,
    slug: string,
    actions: PdiAction[],
    managerFeedback: string,
  ): Promise<Pdi> => {
    const res = await api.post<Pdi>(
      `tenants/${tenantSlug}/performance-development-plans/${slug}/manager`,
      { actions, managerFeedback },
    )
    return res.data
  },

  submitColaborador: async (
    tenantSlug: string,
    slug: string,
    colaboradorNome: string,
    comentario: string,
  ): Promise<Pdi> => {
    const res = await api.post<Pdi>(
      `tenants/${tenantSlug}/performance-development-plans/${slug}/colaborador`,
      { colaboradorNome, comentario },
    )
    return res.data
  },
}

// Com VITE_MOCK_PERF=true usa o mock em localStorage (sem backend/DB);
// caso contrário, usa a API real.
const useMock = import.meta.env.VITE_MOCK_PERF === 'true'

export const pdiService = useMock ? mockPdiService : apiPdiService
