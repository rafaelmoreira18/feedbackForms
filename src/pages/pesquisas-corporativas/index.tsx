import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import { tenantService } from '@/services/tenant-service'
import type { PesquisaCorporativa, PesquisaBloco, PesquisaResposta, PesquisaMetricas } from '@/types'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import MetricCard from '@/components/ui/metric-card'
import Select from '@/components/ui/select'
import Input from '@/components/ui/input'
import { ROUTES } from '@/routes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function questionAvgColor(avg: number, max: number) {
  const pct = avg / max
  if (pct >= 0.75) return { barColor: '#52a350', badge: 'bg-green-base/10 text-green-base border border-green-base/30' }
  if (pct >= 0.5)  return { barColor: '#facc15', badge: 'bg-yellow-50 text-yellow-600 border border-yellow-300' }
  return { barColor: '#e74c3c', badge: 'bg-red-base/10 text-red-base border border-red-base/30' }
}

// ─── Análise por pergunta ─────────────────────────────────────────────────────

function QuestionAnalytics({ blocos, metricas }: { blocos: PesquisaBloco[]; metricas: PesquisaMetricas }) {
  const perguntaMap = new Map<string, string>()
  blocos.forEach(b => b.perguntas.forEach(p => {
    if (p.escala !== 'aberta') perguntaMap.set(p.id, p.texto)
  }))

  const stats = Array.from(Object.entries(metricas.porPergunta))
    .map(([id, { media, total }]) => ({ id, texto: perguntaMap.get(id) ?? id, media, total }))
    .filter(s => perguntaMap.has(s.id))
    .sort((a, b) => a.media - b.media)

  if (stats.length === 0) return null

  return (
    <Card shadow="sm" className="flex flex-col gap-4">
      <div>
        <Text variant="body-sm-bold" className="text-gray-400">Análise por Pergunta</Text>
        <Text variant="caption" className="text-gray-300">
          Ordenado da nota mais baixa para mais alta · escala 1–5
        </Text>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map(q => {
          const { barColor, badge } = questionAvgColor(q.media, 5)
          const pct = (q.media / 5) * 100
          return (
            <div key={q.id} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-gray-300 flex-1 leading-relaxed">{q.texto}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 border ${badge}`}>
                  {q.media.toFixed(1)}/5
                </span>
              </div>
              <div className="relative w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: '#e5e7eb' }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Painel de respostas ──────────────────────────────────────────────────────

const LIKERT5_LABELS: Record<number, string> = {
  1: 'Discordo totalmente',
  2: 'Discordo parcialmente',
  3: 'Neutro',
  4: 'Concordo parcialmente',
  5: 'Concordo totalmente',
}
const LIKERT5_COLORS: Record<number, string> = {
  1: 'bg-red-base/10 text-red-base border border-red-base/30',
  2: 'bg-orange-100 text-orange-500 border border-orange-300',
  3: 'bg-yellow-50 text-yellow-600 border border-yellow-300',
  4: 'bg-teal-base/10 text-teal-base border border-teal-base/30',
  5: 'bg-green-base/10 text-green-base border border-green-base/30',
}

function RespostaRow({ resposta, blocos }: { resposta: PesquisaResposta; blocos: PesquisaBloco[] }) {
  const [expanded, setExpanded] = useState(false)

  const perguntaMap = new Map<string, string>()
  blocos.forEach(b => b.perguntas.forEach(p => perguntaMap.set(p.id, p.texto)))

  const numericAnswers = resposta.answers.filter(a => typeof a.valor === 'number')
  const avg = numericAnswers.length > 0
    ? numericAnswers.reduce((s, a) => s + (a.valor as number), 0) / numericAnswers.length
    : null

  const tempo = resposta.metadados?.tempoDeEmpresa as string | undefined

  return (
    <div
      className={`rounded-xl border cursor-pointer transition-all duration-150 ${
        expanded ? 'border-teal-base/50 shadow-md' : 'border-gray-100 hover:border-teal-base/30 shadow-sm'
      } bg-white`}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <Text variant="body-sm-bold" className="text-gray-400 flex-1 min-w-30">
          {resposta.nomeRespondente}
        </Text>
        {tempo && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            {tempo}
          </span>
        )}
        {avg !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${questionAvgColor(avg, 5).badge}`}>
            Média {avg.toFixed(1)}/5
          </span>
        )}
        <Text variant="caption" className="text-gray-300 shrink-0 ml-auto">
          {new Date(resposta.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </Text>
        <span className={`text-gray-300 text-xs transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
          {resposta.answers.map(a => {
            const texto = perguntaMap.get(a.perguntaId)
            if (!texto) return null
            return (
              <div key={a.perguntaId} className="flex items-start gap-3">
                <p className="text-xs text-gray-300 flex-1">{texto}</p>
                {typeof a.valor === 'number' ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${LIKERT5_COLORS[a.valor] ?? ''}`}>
                    {LIKERT5_LABELS[a.valor] ?? a.valor}
                  </span>
                ) : (
                  <p className="text-xs text-gray-400 shrink-0 max-w-xs text-right">{String(a.valor)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ResponsesPanel({ tenantSlug, pesquisa, onClose }: {
  tenantSlug: string
  pesquisa: PesquisaCorporativa
  onClose: () => void
}) {
  const { data: respostas = [], isLoading } = useQuery<PesquisaResposta[]>({
    queryKey: ['pesquisa-respostas', tenantSlug, pesquisa.slug],
    queryFn: () => pesquisasCorporativasService.getRespostas(tenantSlug, pesquisa.slug),
  })

  const { data: metricas } = useQuery<PesquisaMetricas>({
    queryKey: ['pesquisa-metricas', tenantSlug, pesquisa.slug],
    queryFn: () => pesquisasCorporativasService.getMetricas(tenantSlug, pesquisa.slug),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="heading-sm" className="text-gray-400">
            Respostas — {pesquisa.titulo}
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            {pesquisa.periodo ?? pesquisa.tipo} · {respostas.length} {respostas.length === 1 ? 'resposta' : 'respostas'}
          </Text>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>✕ Fechar</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
        </div>
      ) : respostas.length === 0 ? (
        <Card shadow="sm">
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <span className="text-4xl">📭</span>
            <Text variant="body-md" className="text-gray-300">
              Nenhuma resposta registrada ainda.
            </Text>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {metricas && <QuestionAnalytics blocos={pesquisa.blocos} metricas={metricas} />}
          <Text variant="caption" className="text-gray-300">
            {respostas.length} {respostas.length === 1 ? 'resposta' : 'respostas'}
          </Text>
          {respostas.map(r => (
            <RespostaRow key={r.id} resposta={r} blocos={pesquisa.blocos} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal de edição ─────────────────────────────────────────────────────────

function EditModal({ pesquisa, tenantSlug, onClose }: {
  pesquisa: PesquisaCorporativa
  tenantSlug: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState(pesquisa.titulo)
  const [periodo, setPeriodo] = useState(pesquisa.periodo ?? '')

  const update = useMutation({
    mutationFn: () =>
      pesquisasCorporativasService.updatePesquisa(tenantSlug, pesquisa.slug, {
        titulo: titulo.trim() || pesquisa.titulo,
        periodo: periodo.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pesquisas-corporativas', tenantSlug] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <Text as="h2" variant="heading-sm" className="text-gray-400">Editar Pesquisa</Text>
        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
          <Input
            label="Período (ex: 2026-S1)"
            type="text"
            placeholder="2026-S1"
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={update.isPending} onClick={() => update.mutate()}>
            {update.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de pesquisa ─────────────────────────────────────────────────────────

function PesquisaCard({
  pesquisa,
  tenantSlug: _tenantSlug,
  isSelected,
  copied,
  toggleAtivaPending,
  canDelete,
  onSelect,
  onCopy,
  onToggleAtiva,
  onNavigate,
  onEdit,
  onDelete,
}: {
  pesquisa: PesquisaCorporativa
  tenantSlug: string
  isSelected: boolean
  copied: string | null
  toggleAtivaPending: boolean
  canDelete: boolean
  onSelect: () => void
  onCopy: (slug: string) => void
  onToggleAtiva: (p: PesquisaCorporativa) => void
  onNavigate: () => void
  onEdit: () => void
  onDelete: (p: PesquisaCorporativa) => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-teal-base shadow-lg bg-teal-base/5'
          : 'border-transparent hover:border-teal-base/40 bg-white shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Text variant="heading-sm" className="text-gray-400">{pesquisa.titulo}</Text>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${
              pesquisa.ativa ? 'bg-green-base/10 text-green-base' : 'bg-gray-200 text-gray-300'
            }`}>
              {pesquisa.ativa ? 'Ativo' : 'Inativo'}
            </span>
            {pesquisa.periodo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                {pesquisa.periodo}
              </span>
            )}
          </div>
          <Text variant="body-sm" className="text-gray-300 capitalize">
            {pesquisa.tipo} · {pesquisa.blocos?.length ?? 0} blocos
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={onNavigate}>
            Visualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCopy(pesquisa.slug)}>
            {copied === pesquisa.slug ? 'Copiado!' : 'Copiar Link'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleAtiva(pesquisa)}
            disabled={toggleAtivaPending}
          >
            {pesquisa.ativa ? 'Desativar' : 'Ativar'}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            Editar
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-base border-red-base/40 hover:bg-red-base/5"
              onClick={() => onDelete(pesquisa)}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PesquisasCorporativas() {
  const { tenantSlug: slugFromUrl = '' } = useParams<{ tenantSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isGlobal = !slugFromUrl
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? '')
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl

  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaCorporativa | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<PesquisaCorporativa | null>(null)

  const { data: allTenants = [] } = useQuery({
    queryKey: ['tenants-all-active'],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal,
  })

  const { data: pesquisas = [], isLoading } = useQuery<PesquisaCorporativa[]>({
    queryKey: ['pesquisas-corporativas', tenantSlug],
    queryFn: () => pesquisasCorporativasService.getAll(tenantSlug),
    enabled: !!tenantSlug,
  })

  const { data: metricas } = useQuery<PesquisaMetricas>({
    queryKey: ['pesquisa-metricas', tenantSlug, selectedPesquisa?.slug],
    queryFn: () => pesquisasCorporativasService.getMetricas(tenantSlug, selectedPesquisa!.slug),
    enabled: !!tenantSlug && !!selectedPesquisa,
  })

  const isHoldingAdmin = user?.role === 'holding_admin'

  const toggleAtiva = useMutation({
    mutationFn: (p: PesquisaCorporativa) =>
      pesquisasCorporativasService.updateAtiva(tenantSlug, p.slug, !p.ativa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pesquisas-corporativas', tenantSlug] }),
  })

  const deletePesquisa = useMutation({
    mutationFn: (p: PesquisaCorporativa) =>
      pesquisasCorporativasService.delete(tenantSlug, p.slug),
    onSuccess: () => {
      setSelectedPesquisa(null)
      queryClient.invalidateQueries({ queryKey: ['pesquisas-corporativas', tenantSlug] })
    },
  })

  const handleDelete = (p: PesquisaCorporativa) => {
    if (!window.confirm(`Excluir a pesquisa "${p.titulo}"? Esta ação não pode ser desfeita.`)) return
    deletePesquisa.mutate(p)
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${tenantSlug}/pesquisa-corporativa/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(slug)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleSelect = (p: PesquisaCorporativa) => {
    setSelectedPesquisa(prev => prev?.id === p.id ? null : p)
  }

  const tenantOptions = [
    { value: '', label: 'Selecione uma unidade...' },
    ...allTenants.map(t => ({ value: t.slug, label: t.name })),
  ]

  return (
    <div className="min-h-screen">
      {/* Page header — mesmo padrão da página de treinamentos */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Text variant="heading-md" className="text-gray-400">Pesquisas Corporativas</Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">{user?.name}</Text>
          {tenantSlug && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.rhHub(tenantSlug))}>
              ← RH
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tenant selector — global rh_admin */}
        {isGlobal && (
          <Card shadow="sm" className="mb-8">
            <Select
              label="Unidade"
              options={tenantOptions}
              value={selectedSlug}
              onChange={e => {
                setSelectedSlug(e.target.value)
                setSelectedPesquisa(null)
              }}
            />
          </Card>
        )}

        {isGlobal && !tenantSlug ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Text variant="heading-sm" className="text-gray-300">
              Selecione uma unidade para visualizar as pesquisas
            </Text>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pesquisas.length === 0 ? (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <span className="text-5xl">📋</span>
              <Text variant="heading-sm" className="text-gray-300">Nenhuma pesquisa encontrada</Text>
              <Text variant="body-md" className="text-gray-300 max-w-sm">
                As pesquisas corporativas são criadas pela equipe de RH e aparecem aqui quando disponíveis.
              </Text>
            </div>
          </Card>
        ) : selectedPesquisa ? (
          /* ── Pesquisa selecionada: card + métricas + respostas ── */
          <div className="flex flex-col gap-6">
            <PesquisaCard
              pesquisa={selectedPesquisa}
              tenantSlug={tenantSlug}
              isSelected
              copied={copied}
              toggleAtivaPending={toggleAtiva.isPending}
              canDelete={isHoldingAdmin}
              onSelect={() => setSelectedPesquisa(null)}
              onCopy={copyLink}
              onToggleAtiva={p => toggleAtiva.mutate(p)}
              onNavigate={() => window.open(`/${tenantSlug}/pesquisa-corporativa/${selectedPesquisa.slug}`, '_blank')}
              onEdit={() => setEditTarget(selectedPesquisa)}
              onDelete={handleDelete}
            />

            {metricas && metricas.total > 0 && (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <MetricCard title="Total de Respostas" value={metricas.total} />
                {metricas.mediaGeral !== null && (
                  <MetricCard
                    title="Média Geral"
                    value={metricas.mediaGeral.toFixed(1)}
                    subtitle="Escala 1–5"
                  />
                )}
              </div>
            )}

            <ResponsesPanel
              tenantSlug={tenantSlug}
              pesquisa={selectedPesquisa}
              onClose={() => setSelectedPesquisa(null)}
            />
          </div>
        ) : (
          /* ── Lista de pesquisas ── */
          <div className="flex flex-col gap-3">
            {pesquisas.map(p => (
              <PesquisaCard
                key={p.id}
                pesquisa={p}
                tenantSlug={tenantSlug}
                isSelected={false}
                copied={copied}
                toggleAtivaPending={toggleAtiva.isPending}
                canDelete={isHoldingAdmin}
                onSelect={() => handleSelect(p)}
                onCopy={copyLink}
                onToggleAtiva={p => toggleAtiva.mutate(p)}
                onNavigate={() => window.open(`/${tenantSlug}/pesquisa-corporativa/${p.slug}`, '_blank')}
                onEdit={() => setEditTarget(p)}
                onDelete={handleDelete}
              />
            ))}
            <Text variant="caption" className="text-gray-300 text-center mt-2">
              Clique em uma pesquisa para ver as respostas
            </Text>
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          pesquisa={editTarget}
          tenantSlug={tenantSlug}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
