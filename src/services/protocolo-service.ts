import type {
  Protocolo,
  CreateProtocoloDto,
  ProtocoloMetrics,
  ProtocoloStage,
  BlocoTriagem,
  BlocoInvestigacao,
  BlocoDesfecho,
} from '@/types'
import { api } from './api'

function buildQs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Payload de fechamento de um bloco (sem os campos de responsável que são preenchidos no form). */
export type SubmitTriagemPayload = Partial<Omit<BlocoTriagem, 'fechadoEm'>> & {
  responsavelNome: string
  registroProfissional: string
}
export type SubmitInvestigacaoPayload = Partial<Omit<BlocoInvestigacao, 'fechadoEm'>> & {
  responsavelNome: string
  registroProfissional: string
}
export type SubmitDesfechoPayload = Partial<Omit<BlocoDesfecho, 'fechadoEm'>> & {
  responsavelNome: string
  registroProfissional: string
}

export const protocoloService = {
  getAll: async (
    tenantSlug: string,
    filters?: { stage?: ProtocoloStage | 'abertos' },
  ): Promise<Protocolo[]> => {
    const qs = buildQs({ stage: filters?.stage })
    const res = await api.get<Protocolo[]>(`tenants/${tenantSlug}/protocolos${qs}`)
    return res.data
  },

  getAbertos: async (tenantSlug: string): Promise<Protocolo[]> => {
    const res = await api.get<Protocolo[]>(`tenants/${tenantSlug}/protocolos/abertos`)
    return res.data
  },

  getOne: async (tenantSlug: string, slug: string): Promise<Protocolo> => {
    const res = await api.get<Protocolo>(`tenants/${tenantSlug}/protocolos/${slug}`)
    return res.data
  },

  create: async (tenantSlug: string, dto: CreateProtocoloDto): Promise<Protocolo> => {
    const res = await api.post<Protocolo>(`tenants/${tenantSlug}/protocolos`, dto)
    return res.data
  },

  submitTriagem: async (
    tenantSlug: string,
    slug: string,
    payload: SubmitTriagemPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(`tenants/${tenantSlug}/protocolos/${slug}/triagem`, payload)
    return res.data
  },

  submitInvestigacao: async (
    tenantSlug: string,
    slug: string,
    payload: SubmitInvestigacaoPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(
      `tenants/${tenantSlug}/protocolos/${slug}/investigacao`,
      payload,
    )
    return res.data
  },

  submitDesfecho: async (
    tenantSlug: string,
    slug: string,
    payload: SubmitDesfechoPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(`tenants/${tenantSlug}/protocolos/${slug}/desfecho`, payload)
    return res.data
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/protocolos/${slug}`)
  },

  getMetrics: async (
    tenantSlug: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<ProtocoloMetrics> => {
    const qs = buildQs({ startDate: filters?.startDate, endDate: filters?.endDate })
    const res = await api.get<ProtocoloMetrics>(`tenants/${tenantSlug}/protocolos/metrics${qs}`)
    return res.data
  },
}
