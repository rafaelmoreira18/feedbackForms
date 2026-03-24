import type { TrainingSession, CreateTrainingSessionDto } from '@/types'
import { api } from './api'

export interface TrainingResponse {
  id: string
  tenantId: string
  sessionId: string
  respondentName: string
  answers: { questionId: string; value: number }[]
  pontoAlto: string
  jaAplica: string
  recomenda: boolean | null
  recomendaMotivo: string
  comments: string
  createdAt: string
  session?: TrainingSession
}

export interface TrainingMetrics {
  totalResponses: number
  averageSatisfaction: number
  responsesThisMonth: number
  responsesLastMonth: number
  averageNps: number
}

export interface CreateTrainingResponsePayload {
  sessionSlug: string
  respondentName: string
  answers: { questionId: string; value: number }[]
  pointoAlto?: string
  jaAplica?: string
  recomenda?: boolean
  recomendaMotivo?: string
  comments?: string
}

function buildQs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const trainingService = {
  // ── Sessions ──────────────────────────────────────────────────────────────

  getSessions: async (tenantSlug: string): Promise<TrainingSession[]> => {
    const res = await api.get<TrainingSession[]>(`tenants/${tenantSlug}/training-sessions`)
    return res.data
  },

  getSession: async (tenantSlug: string, sessionSlug: string): Promise<TrainingSession> => {
    const res = await api.get<TrainingSession>(`tenants/${tenantSlug}/training-sessions/${sessionSlug}`)
    return res.data
  },

  createSession: async (tenantSlug: string, dto: CreateTrainingSessionDto): Promise<TrainingSession> => {
    const res = await api.post<TrainingSession>(`tenants/${tenantSlug}/training-sessions`, dto)
    return res.data
  },

  updateSession: async (
    tenantSlug: string,
    sessionSlug: string,
    dto: Partial<CreateTrainingSessionDto & { active: boolean }>,
  ): Promise<TrainingSession> => {
    const res = await api.patch<TrainingSession>(
      `tenants/${tenantSlug}/training-sessions/${sessionSlug}`,
      dto,
    )
    return res.data
  },

  deleteSession: async (tenantSlug: string, sessionSlug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/training-sessions/${sessionSlug}`)
  },

  // ── Responses ─────────────────────────────────────────────────────────────

  submitResponse: async (
    tenantSlug: string,
    payload: CreateTrainingResponsePayload,
  ): Promise<TrainingResponse> => {
    const res = await api.post<TrainingResponse>(`tenants/${tenantSlug}/training-responses`, payload)
    return res.data
  },

  getResponses: async (
    tenantSlug: string,
    filters?: { session?: string; startDate?: string; endDate?: string },
  ): Promise<{ data: TrainingResponse[]; total: number }> => {
    const qs = buildQs({
      session: filters?.session,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    })
    const res = await api.get<{ data: TrainingResponse[]; total: number }>(
      `tenants/${tenantSlug}/training-responses${qs}`,
    )
    return res.data
  },

  getMetrics: async (
    tenantSlug: string,
    filters?: { session?: string; startDate?: string; endDate?: string },
  ): Promise<TrainingMetrics> => {
    const qs = buildQs({
      session: filters?.session,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    })
    const res = await api.get<TrainingMetrics>(
      `tenants/${tenantSlug}/training-responses/metrics${qs}`,
    )
    return res.data
  },
}
