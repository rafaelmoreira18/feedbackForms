import type {
  PerformanceEvaluation,
  PerformanceAnswer,
  CreatePerformanceEvaluationDto,
} from '@/types'
import { api } from './api'
import { mockPerformanceEvaluationService } from './performance-evaluation-service.mock'

const apiPerformanceEvaluationService = {
  getAll: async (tenantSlug: string): Promise<PerformanceEvaluation[]> => {
    const res = await api.get<PerformanceEvaluation[]>(
      `tenants/${tenantSlug}/performance-evaluations`,
    )
    return res.data
  },

  getOne: async (tenantSlug: string, slug: string): Promise<PerformanceEvaluation> => {
    const res = await api.get<PerformanceEvaluation>(
      `tenants/${tenantSlug}/performance-evaluations/${slug}`,
    )
    return res.data
  },

  create: async (
    tenantSlug: string,
    dto: CreatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation> => {
    const res = await api.post<PerformanceEvaluation>(
      `tenants/${tenantSlug}/performance-evaluations`,
      dto,
    )
    return res.data
  },

  update: async (
    tenantSlug: string,
    slug: string,
    dto: Partial<CreatePerformanceEvaluationDto & { active: boolean }>,
  ): Promise<PerformanceEvaluation> => {
    const res = await api.patch<PerformanceEvaluation>(
      `tenants/${tenantSlug}/performance-evaluations/${slug}`,
      dto,
    )
    return res.data
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/performance-evaluations/${slug}`)
  },

  submitManager: async (
    tenantSlug: string,
    slug: string,
    answers: PerformanceAnswer[],
  ): Promise<PerformanceEvaluation> => {
    const res = await api.post<PerformanceEvaluation>(
      `tenants/${tenantSlug}/performance-evaluations/${slug}/manager`,
      { answers },
    )
    return res.data
  },

  submitSelf: async (
    tenantSlug: string,
    slug: string,
    answers: PerformanceAnswer[],
  ): Promise<PerformanceEvaluation> => {
    const res = await api.post<PerformanceEvaluation>(
      `tenants/${tenantSlug}/performance-evaluations/${slug}/self`,
      { answers },
    )
    return res.data
  },
}

// Com VITE_MOCK_PERF=true usa o mock em localStorage (sem backend/DB);
// caso contrário, usa a API real.
const useMock = import.meta.env.VITE_MOCK_PERF === 'true'

export const performanceEvaluationService = useMock
  ? mockPerformanceEvaluationService
  : apiPerformanceEvaluationService
