// Mock localStorage-backed do pdiService — ativado por VITE_MOCK_PERF=true.
// Permite testar todo o fluxo do PDI (criar a partir de uma avaliação concluída →
// gestor preenche ações → colaborador valida → relatório) no navegador, sem backend.
// Lê a avaliação de origem do mesmo storage usado pelo mock de avaliações
// (mock_perf_evals_v1) para copiar o cabeçalho.

import type { Pdi, PdiAction, CreatePdiDto, PerformanceEvaluation } from '@/types'

const STORAGE_KEY = 'mock_pdis_v1'
const EVAL_STORAGE_KEY = 'mock_perf_evals_v1'

function load(): Pdi[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Pdi[]
  } catch {
    return []
  }
}

function save(all: Pdi[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function loadEvaluations(): PerformanceEvaluation[] {
  try {
    return JSON.parse(localStorage.getItem(EVAL_STORAGE_KEY) ?? '[]') as PerformanceEvaluation[]
  } catch {
    return []
  }
}

function uuid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 150))

function findOrThrow(tenantSlug: string, slug: string): Pdi {
  const found = load().find((p) => p.tenantId === tenantSlug && p.slug === slug)
  if (!found) throw new Error('PDI não encontrado')
  return found
}

function persistUpdate(updated: Pdi): Pdi {
  const all = load().map((p) => (p.id === updated.id ? updated : p))
  save(all)
  return updated
}

export const mockPdiService = {
  getAll: async (tenantSlug: string): Promise<Pdi[]> => {
    const list = load()
      .filter((p) => p.tenantId === tenantSlug)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return delay(list)
  },

  getOne: async (tenantSlug: string, slug: string): Promise<Pdi> => {
    return delay(findOrThrow(tenantSlug, slug))
  },

  create: async (tenantSlug: string, dto: CreatePdiDto): Promise<Pdi> => {
    const all = load()
    const evaluation = loadEvaluations().find(
      (e) => e.tenantId === tenantSlug && e.slug === dto.evaluationSlug,
    )
    if (!evaluation) throw new Error('Avaliação não encontrada')
    if (evaluation.status !== 'concluida') {
      throw new Error('O PDI só pode ser criado após a avaliação ser concluída')
    }
    if (all.some((p) => p.tenantId === tenantSlug && p.evaluationId === evaluation.id)) {
      throw new Error('Já existe um PDI para esta avaliação')
    }

    const now = new Date().toISOString()
    const pdi: Pdi = {
      id: uuid(),
      tenantId: tenantSlug,
      createdByUserId: 'mock-user',
      slug: `${evaluation.slug}-pdi`,
      evaluationId: evaluation.id,
      evaluationSlug: evaluation.slug,
      colaboradorNome: evaluation.colaboradorNome,
      setor: evaluation.setor,
      cargo: evaluation.cargo,
      gestorArea: evaluation.gestorArea,
      projeto: evaluation.projeto,
      avaliador: evaluation.avaliador,
      dataAvaliacao: evaluation.dataAvaliacao,
      status: 'pendente',
      actions: null,
      managerFeedback: null,
      managerSubmittedAt: null,
      colaboradorNomeValidacao: null,
      colaboradorComentario: null,
      colaboradorSubmittedAt: null,
      active: true,
      createdAt: now,
    }
    save([pdi, ...all])
    return delay(pdi)
  },

  update: async (
    tenantSlug: string,
    slug: string,
    dto: Partial<{ active: boolean }>,
  ): Promise<Pdi> => {
    const current = findOrThrow(tenantSlug, slug)
    const updated: Pdi = { ...current, ...dto }
    return delay(persistUpdate(updated))
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    const all = load().filter((p) => !(p.tenantId === tenantSlug && p.slug === slug))
    save(all)
    return delay(undefined)
  },

  submitManager: async (
    tenantSlug: string,
    slug: string,
    actions: PdiAction[],
    managerFeedback: string,
  ): Promise<Pdi> => {
    const current = findOrThrow(tenantSlug, slug)
    if (!current.active) throw new Error('Este PDI está inativo')
    if (current.status === 'concluida') throw new Error('Este PDI já foi concluído')
    const updated: Pdi = {
      ...current,
      actions,
      managerFeedback,
      managerSubmittedAt: new Date().toISOString(),
      status: 'aguardando_colaborador',
    }
    return delay(persistUpdate(updated))
  },

  submitColaborador: async (
    tenantSlug: string,
    slug: string,
    colaboradorNome: string,
    comentario: string,
  ): Promise<Pdi> => {
    const current = findOrThrow(tenantSlug, slug)
    if (!current.active) throw new Error('Este PDI está inativo')
    if (current.status === 'pendente') {
      throw new Error('Aguarde o gestor preencher o PDI antes de validar')
    }
    if (current.status === 'concluida') throw new Error('Este PDI já foi concluído')
    const updated: Pdi = {
      ...current,
      colaboradorNomeValidacao: colaboradorNome,
      colaboradorComentario: comentario,
      colaboradorSubmittedAt: new Date().toISOString(),
      status: 'concluida',
    }
    return delay(persistUpdate(updated))
  },
}
