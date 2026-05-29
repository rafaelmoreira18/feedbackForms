// Mock localStorage-backed do performanceEvaluationService — ativado por
// VITE_MOCK_PERF=true. Permite testar todo o fluxo (criar → gestor → colaborador
// → radar) no navegador, sem backend nem banco. Os dados ficam em localStorage,
// escopados por tenant via o campo `tenantId` (= tenantSlug no mock).

import type {
  PerformanceEvaluation,
  PerformanceAnswer,
  CreatePerformanceEvaluationDto,
} from '@/types'

const STORAGE_KEY = 'mock_perf_evals_v1'

function load(): PerformanceEvaluation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PerformanceEvaluation[]
  } catch {
    return []
  }
}

function save(all: PerformanceEvaluation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function uuid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

// pequeno atraso pra simular rede e exercitar estados de loading
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 150))

function findOrThrow(tenantSlug: string, slug: string): PerformanceEvaluation {
  const found = load().find((e) => e.tenantId === tenantSlug && e.slug === slug)
  if (!found) throw new Error('Avaliação não encontrada')
  return found
}

function persistUpdate(updated: PerformanceEvaluation): PerformanceEvaluation {
  const all = load().map((e) => (e.id === updated.id ? updated : e))
  save(all)
  return updated
}

export const mockPerformanceEvaluationService = {
  getAll: async (tenantSlug: string): Promise<PerformanceEvaluation[]> => {
    const list = load()
      .filter((e) => e.tenantId === tenantSlug)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return delay(list)
  },

  getOne: async (tenantSlug: string, slug: string): Promise<PerformanceEvaluation> => {
    return delay(findOrThrow(tenantSlug, slug))
  },

  create: async (
    tenantSlug: string,
    dto: CreatePerformanceEvaluationDto,
  ): Promise<PerformanceEvaluation> => {
    const all = load()
    const base = toSlug(dto.colaboradorNome)
    const dateSuffix = (dto.dataAvaliacao ?? '').replace(/-/g, '').slice(0, 8)
    let slug = dateSuffix ? `${base}-${dateSuffix}` : base
    if (all.some((e) => e.tenantId === tenantSlug && e.slug === slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const now = new Date().toISOString()
    const evaluation: PerformanceEvaluation = {
      id: uuid(),
      tenantId: tenantSlug,
      createdByUserId: 'mock-user',
      slug,
      colaboradorNome: dto.colaboradorNome,
      setor: dto.setor,
      cargo: dto.cargo,
      gestorArea: dto.gestorArea,
      projeto: dto.projeto ?? '',
      avaliador: dto.avaliador,
      dataAvaliacao: dto.dataAvaliacao,
      status: 'pendente',
      managerAnswers: null,
      selfAnswers: null,
      managerSubmittedAt: null,
      selfSubmittedAt: null,
      active: true,
      createdAt: now,
    }
    save([evaluation, ...all])
    return delay(evaluation)
  },

  update: async (
    tenantSlug: string,
    slug: string,
    dto: Partial<CreatePerformanceEvaluationDto & { active: boolean }>,
  ): Promise<PerformanceEvaluation> => {
    const current = findOrThrow(tenantSlug, slug)
    const updated: PerformanceEvaluation = { ...current, ...dto }
    return delay(persistUpdate(updated))
  },

  remove: async (tenantSlug: string, slug: string): Promise<void> => {
    const all = load().filter((e) => !(e.tenantId === tenantSlug && e.slug === slug))
    save(all)
    return delay(undefined)
  },

  submitManager: async (
    tenantSlug: string,
    slug: string,
    answers: PerformanceAnswer[],
  ): Promise<PerformanceEvaluation> => {
    const current = findOrThrow(tenantSlug, slug)
    if (!current.active) throw new Error('Esta avaliação está inativa')
    if (current.status === 'concluida') throw new Error('Esta avaliação já foi concluída')
    const updated: PerformanceEvaluation = {
      ...current,
      managerAnswers: answers,
      managerSubmittedAt: new Date().toISOString(),
      status: 'aguardando_colaborador',
    }
    return delay(persistUpdate(updated))
  },

  submitSelf: async (
    tenantSlug: string,
    slug: string,
    answers: PerformanceAnswer[],
  ): Promise<PerformanceEvaluation> => {
    const current = findOrThrow(tenantSlug, slug)
    if (!current.active) throw new Error('Esta avaliação está inativa')
    if (current.status === 'pendente') {
      throw new Error('Aguarde a avaliação do gestor antes de preencher a autoavaliação')
    }
    if (current.status === 'concluida') throw new Error('Esta avaliação já foi concluída')
    const updated: PerformanceEvaluation = {
      ...current,
      selfAnswers: answers,
      selfSubmittedAt: new Date().toISOString(),
      status: 'concluida',
    }
    return delay(persistUpdate(updated))
  },
}
