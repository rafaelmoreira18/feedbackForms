import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { trainingService } from '@/services/training-service'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import { performanceEvaluationService } from '@/services/performance-evaluation-service'
import { tenantService } from '@/services/tenant-service'
import type { PesquisaCorporativa, PerformanceEvaluation } from '@/types'
import { ROUTES } from '@/routes'
import { groupSessions, PairedSessionCard } from '@/pages/rh/treinamentos/session-table'
import type { SessionGroup } from '@/pages/rh/treinamentos/session-table'
import { ResponsesPanel as TreinamentoResponsesPanel } from '@/pages/rh/treinamentos/session-detail'
import { ResponsesPanel as CorporativaResponsesPanel } from '@/pages/rh/pesquisas-corporativas/pesquisa-respostas'
import { PesquisaCard } from '@/pages/rh/pesquisas-corporativas/pesquisa-table'
import { Breadcrumb, ItemRow, FolderRow } from '@/pages/rh/hub/hub-icons'
import { SessionForm } from '@/pages/rh/treinamentos/session-form-modal'
import { AvaliacaoForm } from '@/pages/rh/avaliacao-desempenho/avaliacao-form-modal'
import { AvaliacaoPanel } from '@/pages/rh/avaliacao-desempenho/avaliacao-panel'
import Text from '@/components/ui/text'
import Card from '@/components/ui/card'
import Select from '@/components/ui/select'

// ─── Hub ──────────────────────────────────────────────────────────────────────

export default function RhHub() {
  const { tenantSlug: slugFromUrl = '' } = useParams<{ tenantSlug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isGlobal = !slugFromUrl
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? '')
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl

  // tree state
  const [openTreinamentos, setOpenTreinamentos] = useState(false)
  const [openCorporativas, setOpenCorporativas] = useState(false)
  const [openAvaliacoes, setOpenAvaliacoes] = useState(false)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})

  // selection state
  const [selectedGroup, setSelectedGroup] = useState<SessionGroup | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionGroup['reacao'] | null>(null)
  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaCorporativa | null>(null)
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<PerformanceEvaluation | null>(null)
  const [showCreateAvaliacao, setShowCreateAvaliacao] = useState(false)

  // copy link — single state tracks whichever slug was last copied
  const [copied, setCopied] = useState<string | null>(null)

  const [showCreateTreinamento, setShowCreateTreinamento] = useState(false)

  // refs para resolução de pesquisa equivalente ao trocar unidade
  const pendingPesquisa = useRef<PesquisaCorporativa | null>(null)
  const prevTenantSlug = useRef(tenantSlug)

  // mutations
  const toggleActive = useMutation({
    mutationFn: (session: SessionGroup['reacao']) =>
      trainingService.updateSession(tenantSlug, session.slug, { active: !session.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-sessions', tenantSlug] }),
  })

  const createEficacia = useMutation({
    mutationFn: (reacaoSlug: string) => trainingService.createEficacia(tenantSlug, reacaoSlug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-sessions', tenantSlug] }),
  })

  const copyLink = (slug: string, path: 'treinamento' | 'pesquisa-corporativa' = 'treinamento') => {
    const url = `${window.location.origin}/${tenantSlug}/${path}/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(slug)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const toggleAtivaPesquisa = useMutation({
    mutationFn: (p: PesquisaCorporativa) =>
      pesquisasCorporativasService.updateAtiva(tenantSlug, p.slug, !p.ativa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pesquisas-corporativas', tenantSlug] }),
  })

  // queries
  const { data: allTenants = [] } = useQuery({
    queryKey: ['tenants-all-active'],
    queryFn: tenantService.getAllActive,
  })

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['training-sessions', tenantSlug],
    queryFn: () => trainingService.getSessions(tenantSlug),
    enabled: !!tenantSlug,
  })

  const { data: pesquisas = [], isLoading: loadingPesquisas } = useQuery({
    queryKey: ['pesquisas-corporativas', tenantSlug],
    queryFn: () => pesquisasCorporativasService.getAll(tenantSlug),
    enabled: !!tenantSlug,
  })

  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useQuery({
    queryKey: ['performance-evaluations', tenantSlug],
    queryFn: () => performanceEvaluationService.getAll(tenantSlug),
    enabled: !!tenantSlug,
  })

  // ao trocar unidade com pesquisa aberta, detecta a mudança e salva referência
  if (prevTenantSlug.current !== tenantSlug && selectedPesquisa) {
    pendingPesquisa.current = selectedPesquisa
    prevTenantSlug.current = tenantSlug
    setSelectedPesquisa(null)
  } else if (prevTenantSlug.current !== tenantSlug) {
    prevTenantSlug.current = tenantSlug
  }

  // quando as pesquisas da nova unidade chegam, resolve o equivalente
  useEffect(() => {
    if (!pendingPesquisa.current || pesquisas.length === 0) return
    const ref = pendingPesquisa.current
    pendingPesquisa.current = null
    const match = pesquisas.find(p => p.tipo === ref.tipo && p.categoria === ref.categoria)
    setSelectedPesquisa(match ?? null)
  }, [pesquisas])

  const { groups: sessionGroups } = useMemo(() => groupSessions(sessions), [sessions])

  const categoriaMap = new Map<string, typeof pesquisas>()
  for (const p of pesquisas) {
    const key = p.categoria ?? 'Geral'
    if (!categoriaMap.has(key)) categoriaMap.set(key, [])
    categoriaMap.get(key)!.push(p)
  }
  const categorias = Array.from(categoriaMap.entries()).sort(([a], [b]) =>
    a === 'Geral' ? 1 : b === 'Geral' ? -1 : a.localeCompare(b, 'pt-BR'),
  )

  const toggleCategory = (cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }))

  const tenantOptions = [
    { value: '', label: 'Selecione uma unidade...' },
    ...allTenants.map(t => ({ value: t.slug, label: t.name })),
  ]

  const isLoading = loadingSessions || loadingPesquisas || loadingAvaliacoes

  const canCreate = user?.role === 'rh_admin' || user?.role === 'holding_admin'
  const canDelete = user?.role === 'holding_admin'
  const canManage = user?.role === 'holding_admin' || (user?.role === 'rh_admin' && !user?.tenantId)

  function closeGroup() {
    setSelectedGroup(null)
    setSelectedSession(null)
  }

  return (
    <div className="min-h-screen">
      {/* Header + unit selector — always narrow */}
      <div className="max-w-3xl mx-auto px-4 pt-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Text variant="heading-md" className="text-gray-400">RH</Text>
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">{user?.name}</Text>
        </div>

        {isGlobal && (
          <Card shadow="sm">
            <Select
              label="Unidade"
              options={tenantOptions}
              value={selectedSlug}
              onChange={e => setSelectedSlug(e.target.value)}
            />
          </Card>
        )}
      </div>

      {/* Content — widens when a training group is open */}
      <div className={`${selectedGroup ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 pb-6 pt-6 flex flex-col gap-6`}>

        {isGlobal && !tenantSlug ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Text variant="heading-sm" className="text-gray-300">
              Selecione uma unidade para visualizar
            </Text>
          </div>

        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>

        ) : selectedGroup ? (
          <>
            <Breadcrumb
              parts={['Treinamentos', selectedGroup.reacao.title]}
              onClose={closeGroup}
            />
            <PairedSessionCard
              group={selectedGroup}
              tenantSlug={tenantSlug}
              selectedSession={selectedSession}
              canCreate={canCreate}
              canManage={canManage}
              canDelete={canDelete}
              copied={copied}
              toggleActivePending={toggleActive.isPending}
              createEficaciaPending={createEficacia.isPending}
              onSelect={(s) => setSelectedSession(prev => prev?.id === s.id ? null : s)}
              onCopy={copyLink}
              onToggleActive={(s) => toggleActive.mutate(s)}
              onEdit={() => {}}
              onDelete={() => {}}
              onNavigate={(s) => navigate(ROUTES.treinamento(tenantSlug, s.slug))}
              onCreateEficacia={(slug) => createEficacia.mutate(slug)}
            />
            {selectedSession && (
              <TreinamentoResponsesPanel
                tenantSlug={tenantSlug}
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
              />
            )}
          </>

        ) : selectedPesquisa ? (
          <>
            <Breadcrumb
              parts={[
                allTenants.find(t => t.slug === tenantSlug)?.name ?? tenantSlug,
                'Pesquisas Corporativas',
                selectedPesquisa.categoria ?? 'Geral',
                selectedPesquisa.titulo.replace(/^\[TESTE\]\s*/i, ''),
              ]}
              onClose={() => setSelectedPesquisa(null)}
            />
            <PesquisaCard
              pesquisa={selectedPesquisa}
              tenantSlug={tenantSlug}
              isSelected={false}
              copied={copied}
              toggleAtivaPending={toggleAtivaPesquisa.isPending}
              canManage={canManage}
              canDelete={canDelete}
              onSelect={() => {}}
              onCopy={(slug) => copyLink(slug, 'pesquisa-corporativa')}
              onToggleAtiva={(p) => toggleAtivaPesquisa.mutate(p)}
              onNavigate={() => navigate(`/${tenantSlug}/pesquisa-corporativa/${selectedPesquisa.slug}`)}
              onEdit={() => {}}
              onDelete={() => {}}
            />
            <CorporativaResponsesPanel
              tenantSlug={tenantSlug}
              pesquisa={selectedPesquisa}
              onClose={() => setSelectedPesquisa(null)}
            />
          </>

        ) : selectedAvaliacao ? (
          <>
            <Breadcrumb
              parts={[
                allTenants.find(t => t.slug === tenantSlug)?.name ?? tenantSlug,
                'Avaliações de Desempenho',
                selectedAvaliacao.colaboradorNome,
              ]}
              onClose={() => setSelectedAvaliacao(null)}
            />
            <AvaliacaoPanel
              tenantSlug={tenantSlug}
              evaluation={avaliacoes.find(a => a.slug === selectedAvaliacao.slug) ?? selectedAvaliacao}
              canManage={canManage}
              canDelete={canDelete}
              onClose={() => setSelectedAvaliacao(null)}
              onDeleted={() => setSelectedAvaliacao(null)}
            />
          </>

        ) : (
          <>
          {showCreateAvaliacao && (
            <AvaliacaoForm
              tenantSlug={tenantSlug}
              onClose={() => setShowCreateAvaliacao(false)}
              onSaved={() => setShowCreateAvaliacao(false)}
            />
          )}
          {showCreateTreinamento && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <SessionForm
                  tenantSlug={tenantSlug}
                  onClose={() => setShowCreateTreinamento(false)}
                  onSaved={() => setShowCreateTreinamento(false)}
                />
              </div>
            </div>
          )}
          <Card shadow="sm" className="py-2 px-0 overflow-hidden">

            <FolderRow
              label="Treinamentos"
              count={sessionGroups.length}
              open={openTreinamentos}
              depth={0}
              onToggle={() => setOpenTreinamentos(v => !v)}
              action={canCreate && tenantSlug ? { label: '+ Novo', onClick: () => setShowCreateTreinamento(true) } : undefined}
            />
            {openTreinamentos && (
              sessions.length === 0
                ? <ItemRow label="Nenhuma sessão criada" depth={1} onClick={() => {}} />
                : sessionGroups.map((group) => (
                    <ItemRow
                      key={group.reacao.id}
                      label={group.reacao.title}
                      depth={1}
                      onClick={() => { setSelectedGroup(group); setSelectedSession(null) }}
                    />
                  ))
            )}

            <div className="border-t border-gray-100 my-1" />

            <FolderRow
              label="Pesquisas Corporativas"
              count={pesquisas.length}
              open={openCorporativas}
              depth={0}
              onToggle={() => setOpenCorporativas(v => !v)}
            />
            {openCorporativas && (
              pesquisas.length === 0
                ? <ItemRow label="Nenhuma pesquisa disponível" depth={1} onClick={() => {}} />
                : categorias.map(([categoria, items]) => {
                    const isOpen = openCategories[categoria] ?? false
                    return (
                      <div key={categoria}>
                        <FolderRow
                          label={categoria}
                          count={items.length}
                          open={isOpen}
                          depth={1}
                          onToggle={() => toggleCategory(categoria)}
                        />
                        {isOpen && items.map(p => (
                          <ItemRow
                            key={p.id}
                            label={p.titulo.replace(/^\[TESTE\]\s*/i, '')}
                            depth={2}
                            onClick={() => setSelectedPesquisa(p)}
                          />
                        ))}
                      </div>
                    )
                  })
            )}

            <div className="border-t border-gray-100 my-1" />

            <FolderRow
              label="Avaliações de Desempenho"
              count={avaliacoes.length}
              open={openAvaliacoes}
              depth={0}
              onToggle={() => setOpenAvaliacoes(v => !v)}
              action={canCreate && tenantSlug ? { label: '+ Novo', onClick: () => setShowCreateAvaliacao(true) } : undefined}
            />
            {openAvaliacoes && (
              avaliacoes.length === 0
                ? <ItemRow label="Nenhuma avaliação criada" depth={1} onClick={() => {}} />
                : avaliacoes.map((a) => (
                    <ItemRow
                      key={a.id}
                      label={a.colaboradorNome}
                      depth={1}
                      onClick={() => setSelectedAvaliacao(a)}
                    />
                  ))
            )}
          </Card>
          </>
        )}
      </div>
    </div>
  )
}
