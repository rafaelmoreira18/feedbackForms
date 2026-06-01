import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import { generatePesquisaCorporativaReport } from '@/services/pesquisa-corporativa-report.service'
import type { PesquisaCorporativa, PesquisaBloco, PesquisaResposta, PesquisaMetricas } from '@/types'
import { questionAvgColor } from '@/utils/rh-colors'
import { RhPagination } from '@/pages/rh/hub/hub-icons'
import Text from '@/components/ui/text'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'

const PAGE_SIZE = 10;

const LIKERT5_LABELS: Record<number, string> = {
  1: 'Muito insatisfeito',
  2: 'Insatisfeito',
  3: 'Regular',
  4: 'Satisfeito',
  5: 'Muito satisfeito',
}

const LIKERT5_COLORS: Record<number, string> = {
  1: 'bg-red-base/10 text-red-base border border-red-base/30',
  2: 'bg-orange-100 text-orange-500 border border-orange-300',
  3: 'bg-yellow-50 text-yellow-600 border border-yellow-300',
  4: 'bg-teal-base/10 text-teal-base border border-teal-base/30',
  5: 'bg-green-base/10 text-green-base border border-green-base/30',
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

// ─── Linha de resposta individual ────────────────────────────────────────────

function RespostaRow({ resposta, blocos }: { resposta: PesquisaResposta; blocos: PesquisaBloco[] }) {
  const [expanded, setExpanded] = useState(false)

  const perguntaMap = new Map<string, string>()
  blocos.forEach(b => b.perguntas.forEach(p => perguntaMap.set(p.id, p.texto)))

  const numericAnswers = resposta.answers.filter(a => typeof a.valor === 'number')
  const avg = numericAnswers.length > 0
    ? numericAnswers.reduce((s, a) => s + (a.valor as number), 0) / numericAnswers.length
    : null

  const fornecedor = (resposta.metadados?.fornecedor as string | undefined)?.trim() || null
  const tempo = resposta.metadados?.tempoDeEmpresa as string | undefined
  const tituloLinha = fornecedor || resposta.nomeRespondente

  return (
    <div
      className={`rounded-xl border cursor-pointer transition-all duration-150 ${
        expanded ? 'border-teal-base/50 shadow-md' : 'border-gray-100 hover:border-teal-base/30 shadow-sm'
      } bg-white`}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <Text variant="body-sm-bold" className="text-gray-400 flex-1 min-w-30">
          {tituloLinha}
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
        <svg viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}>
          <path d="M3.22 6.22a.75.75 0 0 1 1.06 0L8 9.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
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

// ─── Painel de respostas ──────────────────────────────────────────────────────

export function ResponsesPanel({ tenantSlug, pesquisa, onClose: _onClose }: {
  tenantSlug: string
  pesquisa: PesquisaCorporativa
  onClose: () => void
}) {
  const [page, setPage] = useState(1)

  const { data: respostas = [], isLoading } = useQuery<PesquisaResposta[]>({
    queryKey: ['pesquisa-respostas', tenantSlug, pesquisa.slug],
    queryFn: () => pesquisasCorporativasService.getRespostas(tenantSlug, pesquisa.slug),
  })

  const { data: metricas } = useQuery<PesquisaMetricas>({
    queryKey: ['pesquisa-metricas', tenantSlug, pesquisa.slug],
    queryFn: () => pesquisasCorporativasService.getMetricas(tenantSlug, pesquisa.slug),
  })

  const totalPages = Math.ceil(respostas.length / PAGE_SIZE)
  const paged = respostas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const mediaGeral = metricas?.mediaGeral ?? null

  const canExport = !!metricas && respostas.length > 0
  const handleExport = () => {
    if (!metricas) return
    generatePesquisaCorporativaReport(pesquisa, metricas)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Text variant="heading-sm" className="text-gray-400">
            Respostas — {pesquisa.titulo}
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            {pesquisa.periodo ?? pesquisa.tipo} · {respostas.length} {respostas.length === 1 ? 'resposta' : 'respostas'}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              Exportar PDF
            </Button>
          )}
          {mediaGeral !== null && (
            <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${questionAvgColor(mediaGeral, 5).badge}`}>
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Média geral</span>
              <span className="text-2xl font-bold leading-tight">{mediaGeral.toFixed(1)}</span>
              <span className="text-xs opacity-70">/ 5</span>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
        </div>
      ) : respostas.length === 0 ? (
        <Card shadow="sm">
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <span className="text-4xl">📭</span>
            <Text variant="body-md" className="text-gray-300">Nenhuma resposta registrada ainda.</Text>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {metricas && <QuestionAnalytics blocos={pesquisa.blocos} metricas={metricas} />}
          <Text variant="caption" className="text-gray-300">
            {respostas.length} {respostas.length === 1 ? 'resposta' : 'respostas'}
          </Text>
          {paged.map(r => (
            <RespostaRow key={r.id} resposta={r} blocos={pesquisa.blocos} />
          ))}
          <RhPagination
            page={page}
            totalPages={totalPages}
            total={respostas.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
