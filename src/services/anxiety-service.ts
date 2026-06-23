import type {
  AnxietyAssessment,
  AnxietyAssessmentPublicView,
  CreateAnxietyAssessmentDto,
  SubmitAnxietyAnswersDto,
} from '@/types'
import { api } from './api'

export const anxietyService = {
  // ── Gestão (RH, protegido) ──────────────────────────────────────────────────

  getAll: async (tenantSlug: string): Promise<AnxietyAssessment[]> => {
    const res = await api.get<AnxietyAssessment[]>(`tenants/${tenantSlug}/anxiety-assessments`)
    return res.data
  },

  create: async (
    tenantSlug: string,
    dto: CreateAnxietyAssessmentDto,
  ): Promise<AnxietyAssessment> => {
    const res = await api.post<AnxietyAssessment>(`tenants/${tenantSlug}/anxiety-assessments`, dto)
    return res.data
  },

  update: async (
    tenantSlug: string,
    slug: string,
    dto: Partial<CreateAnxietyAssessmentDto & { active: boolean }>,
  ): Promise<AnxietyAssessment> => {
    const res = await api.patch<AnxietyAssessment>(
      `tenants/${tenantSlug}/anxiety-assessments/${slug}`,
      dto,
    )
    return res.data
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/anxiety-assessments/${slug}`)
  },

  // ── Link público (colaborador) ──────────────────────────────────────────────

  getPublic: async (
    tenantSlug: string,
    slug: string,
  ): Promise<AnxietyAssessmentPublicView> => {
    const res = await api.get<AnxietyAssessmentPublicView>(
      `tenants/${tenantSlug}/anxiety-assessments/${slug}`,
    )
    return res.data
  },

  submit: async (
    tenantSlug: string,
    slug: string,
    payload: SubmitAnxietyAnswersDto,
  ): Promise<AnxietyAssessmentPublicView> => {
    const res = await api.post<AnxietyAssessmentPublicView>(
      `tenants/${tenantSlug}/anxiety-assessments/${slug}/submit`,
      payload,
    )
    return res.data
  },
}
