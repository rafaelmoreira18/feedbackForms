import type {
  PesquisaCorporativa,
  PesquisaResposta,
  PesquisaMetricas,
  CreatePesquisaRespostaDto,
} from '@/types'
import { api } from './api'

export const pesquisasCorporativasService = {
  // ── Gestão (autenticado) ──────────────────────────────────────────────────

  getAll: async (tenantSlug: string): Promise<PesquisaCorporativa[]> => {
    const res = await api.get<PesquisaCorporativa[]>(
      `tenants/${tenantSlug}/pesquisas-corporativas`,
    )
    return res.data
  },

  getBySlug: async (tenantSlug: string, slug: string): Promise<PesquisaCorporativa> => {
    const res = await api.get<PesquisaCorporativa>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}`,
    )
    return res.data
  },

  updateAtiva: async (tenantSlug: string, slug: string, ativa: boolean): Promise<PesquisaCorporativa> => {
    const res = await api.patch<PesquisaCorporativa>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}`,
      { ativa },
    )
    return res.data
  },

  updatePesquisa: async (tenantSlug: string, slug: string, dto: { titulo?: string; periodo?: string }): Promise<PesquisaCorporativa> => {
    const res = await api.patch<PesquisaCorporativa>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}`,
      dto,
    )
    return res.data
  },

  // ── Respostas ──────────────────────────────────────────────────────────────

  getRespostas: async (tenantSlug: string, slug: string): Promise<PesquisaResposta[]> => {
    const res = await api.get<PesquisaResposta[]>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}/respostas`,
    )
    return res.data
  },

  getMetricas: async (tenantSlug: string, slug: string): Promise<PesquisaMetricas> => {
    const res = await api.get<PesquisaMetricas>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}/respostas/metricas`,
    )
    return res.data
  },

  // ── Submissão pública (sem auth) ──────────────────────────────────────────

  getPesquisaPublica: async (tenantSlug: string, slug: string): Promise<PesquisaCorporativa> => {
    const res = await api.get<PesquisaCorporativa>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}/respostas/estrutura`,
    )
    return res.data
  },

  submitResposta: async (
    tenantSlug: string,
    slug: string,
    dto: CreatePesquisaRespostaDto,
  ): Promise<PesquisaResposta> => {
    const res = await api.post<PesquisaResposta>(
      `tenants/${tenantSlug}/pesquisas-corporativas/${slug}/respostas`,
      dto,
    )
    return res.data
  },
}
