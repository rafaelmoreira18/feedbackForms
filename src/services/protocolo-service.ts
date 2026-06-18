import type {
  Protocolo,
  CreateProtocoloDto,
  ProtocoloMetrics,
} from '@/types'
import { api } from './api'

function buildQs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Payload de fechamento/edição de um bloco — campos do form + responsável (do usuário logado). */
export type SubmitBlocoPayload = Record<string, unknown> & {
  responsavelNome: string
  registroProfissional: string
}

// Aliases legados (Dor Torácica) — os formulários de bloco existentes os importam.
export type SubmitTriagemPayload = SubmitBlocoPayload
export type SubmitEcgPayload = SubmitBlocoPayload
export type SubmitInvestigacaoPayload = SubmitBlocoPayload
export type SubmitDesfechoPayload = SubmitBlocoPayload

/** Chave de etapa (genérica por tipo de protocolo). */
export type RascunhoBloco = string

export interface EncerrarPayload {
  motivo: 'nao_continuidade' | 'nao_indicacao'
  observacao: string
  responsavelNome: string
  registroProfissional: string
}

export const protocoloService = {
  getAll: async (
    tenantSlug: string,
    filters?: { protocolType?: string; stage?: string },
  ): Promise<Protocolo[]> => {
    const qs = buildQs({ protocolType: filters?.protocolType, stage: filters?.stage })
    const res = await api.get<Protocolo[]>(`tenants/${tenantSlug}/protocolos${qs}`)
    return res.data
  },

  getAbertos: async (tenantSlug: string, protocolType?: string): Promise<Protocolo[]> => {
    const qs = buildQs({ protocolType })
    const res = await api.get<Protocolo[]>(`tenants/${tenantSlug}/protocolos/abertos${qs}`)
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

  /** Fecha a etapa corrente (avança o protocolo). */
  submitBloco: async (
    tenantSlug: string,
    slug: string,
    stageKey: string,
    payload: SubmitBlocoPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(
      `tenants/${tenantSlug}/protocolos/${slug}/blocos/${stageKey}`,
      payload,
    )
    return res.data
  },

  /** Edita uma etapa já fechada (registra autor/hora/campos no histórico). */
  editarBloco: async (
    tenantSlug: string,
    slug: string,
    stageKey: string,
    payload: SubmitBlocoPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(
      `tenants/${tenantSlug}/protocolos/${slug}/blocos/${stageKey}/editar`,
      payload,
    )
    return res.data
  },

  saveRascunho: async (
    tenantSlug: string,
    slug: string,
    stageKey: string,
    dados: Record<string, unknown>,
  ): Promise<void> => {
    await api.patch(`tenants/${tenantSlug}/protocolos/${slug}/blocos/${stageKey}/rascunho`, { dados })
  },

  encerrar: async (
    tenantSlug: string,
    slug: string,
    payload: EncerrarPayload,
  ): Promise<Protocolo> => {
    const res = await api.patch<Protocolo>(`tenants/${tenantSlug}/protocolos/${slug}/encerrar`, payload)
    return res.data
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    await api.delete(`tenants/${tenantSlug}/protocolos/${slug}`)
  },

  getMetrics: async <T = ProtocoloMetrics>(
    tenantSlug: string,
    filters?: { protocolType?: string; startDate?: string; endDate?: string },
  ): Promise<T> => {
    const qs = buildQs({
      protocolType: filters?.protocolType,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    })
    const res = await api.get<T>(`tenants/${tenantSlug}/protocolos/metrics${qs}`)
    return res.data
  },
}
