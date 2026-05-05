import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { trainingService } from '@/services/training-service'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import { tenantService } from '@/services/tenant-service'
import type { TrainingSession, PesquisaCorporativa } from '@/types'
import Text from '@/components/ui/text'
import Card from '@/components/ui/card'
import Select from '@/components/ui/select'
import { ResponsesPanel as TrainingResponsesPanel } from '@/pages/rh/treinamentos/session-detail'
import { groupSessions } from '@/pages/rh/treinamentos/session-table'
import { ResponsesPanel as CorporativaResponsesPanel } from '@/pages/rh/pesquisas-corporativas/pesquisa-respostas'

// ─── Ícones inline (sem dependência extra) ────────────────────────────────────

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M3.22 6.22a.75.75 0 0 1 1.06 0L8 9.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M1.75 4.5h4.586a.25.25 0 0 1 .177.073l.927.927c.14.14.331.22.53.22h6.28c.138 0 .25.112.25.25v7.28a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .75-.75Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M1.75 4.5h4.586a.25.25 0 0 1 .177.073l.927.927c.14.14.331.22.53.22h6.28c.138 0 .25.112.25.25v7.28a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .75-.75ZM1 5.25v7.03c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25V5.5a.75.75 0 0 0-.75-.75H8a.75.75 0 0 1-.53-.22L6.543 3.6A1.75 1.75 0 0 0 5.306 3H1.75A.75.75 0 0 0 1 3.75v1.5Z" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M2 1.75A1.75 1.75 0 0 1 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 8.75 4.25V1.5Zm6.75.988V4.25c0 .138.112.25.25.25h1.762Z" />
    </svg>
  )
}

// ─── Row de item (pesquisa individual) ────────────────────────────────────────

function ItemRow({
  label,
  count,
  depth,
  onClick,
}: {
  label: string
  count?: number
  depth: number
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group select-none"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onDoubleClick={onClick}
    >
      <FileIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      <span className="text-sm text-gray-400 flex-1 truncate group-hover:text-teal-base transition-colors">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-300 tabular-nums shrink-0">{count}</span>
      )}
    </div>
  )
}

// ─── Row de pasta (colapsável) ────────────────────────────────────────────────

function FolderRow({
  label,
  count,
  open,
  depth,
  onToggle,
  onNavigate,
}: {
  label: string
  count: number
  open: boolean
  depth: number
  onToggle: () => void
  onNavigate?: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group select-none"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onToggle}
      onDoubleClick={e => { e.stopPropagation(); onNavigate?.(); }}
    >
      {open
        ? <ChevronDown className="w-3 h-3 text-gray-300 shrink-0" />
        : <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
      }
      <FolderIcon
        open={open}
        className={`w-3.5 h-3.5 shrink-0 transition-colors ${open ? 'text-teal-base' : 'text-yellow-500'}`}
      />
      <span className="text-sm font-medium text-gray-400 flex-1 truncate group-hover:text-teal-base transition-colors">
        {label}
      </span>
      <span className="text-xs text-gray-300 tabular-nums shrink-0">{count}</span>
    </div>
  )
}

// ─── Hub principal ─────────────────────────────────────────────────────────────

export default function RhHub() {
  const { tenantSlug: slugFromUrl = '' } = useParams<{ tenantSlug: string }>()
  const { user } = useAuth()

  const isGlobal = !slugFromUrl
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? '')
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl

  const [openTreinamentos, setOpenTreinamentos] = useState(false)
  const [openCorporativas, setOpenCorporativas] = useState(false)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaCorporativa | null>(null)

  const { data: allTenants = [] } = useQuery({
    queryKey: ['tenants-all-active'],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal,
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

  // Agrupar sessões em pares reação + eficácia
  const { groups: sessionGroups, standalone: standaloneEficacia } = useMemo(
    () => groupSessions(sessions),
    [sessions],
  )

  // Agrupar pesquisas corporativas por categoria
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

  const isLoading = loadingSessions || loadingPesquisas

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Text variant="heading-md" className="text-gray-400">
            RH
          </Text>
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">
            {user?.name}
          </Text>
        </div>

        {/* Seletor de unidade — global rh_admin */}
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
        ) : (
          <Card shadow="sm" className="py-2 px-0 overflow-hidden">

            {/* ── Treinamentos ── */}
            <FolderRow
              label="Treinamentos"
              count={sessionGroups.length + standaloneEficacia.length}
              open={openTreinamentos}
              depth={0}
              onToggle={() => setOpenTreinamentos(v => !v)}
            />

            {openTreinamentos && (
              <>
                {sessions.length === 0 ? (
                  <ItemRow label="Nenhuma sessão criada" depth={1} onClick={() => {}} />
                ) : (
                  <>
                    {sessionGroups.map(({ reacao, eficacia }) => {
                      const isOpen = openCategories[reacao.id] ?? false
                      const childCount = eficacia ? 2 : 1
                      return (
                        <div key={reacao.id}>
                          <FolderRow
                            label={reacao.title}
                            count={childCount}
                            open={isOpen}
                            depth={1}
                            onToggle={() => toggleCategory(reacao.id)}
                          />
                          {isOpen && (
                            <>
                              <ItemRow
                                label="Avaliação de Reação"
                                depth={2}
                                onClick={() => setSelectedSession(reacao)}
                              />
                              {eficacia ? (
                                <ItemRow
                                  label="Avaliação de Eficácia"
                                  depth={2}
                                  onClick={() => setSelectedSession(eficacia)}
                                />
                              ) : (
                                <ItemRow
                                  label="Avaliação de Eficácia — pendente"
                                  depth={2}
                                  onClick={() => {}}
                                />
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                    {standaloneEficacia.map(s => (
                      <ItemRow
                        key={s.id}
                        label={`${s.title} (Eficácia)`}
                        depth={1}
                        onClick={() => setSelectedSession(s)}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 my-1" />

            {/* ── Pesquisas Corporativas ── */}
            <FolderRow
              label="Pesquisas Corporativas"
              count={pesquisas.length}
              open={openCorporativas}
              depth={0}
              onToggle={() => setOpenCorporativas(v => !v)}
            />

            {openCorporativas && (
              <>
                {pesquisas.length === 0 ? (
                  <ItemRow label="Nenhuma pesquisa disponível" depth={1} onClick={() => {}} />
                ) : (
                  categorias.map(([categoria, items]) => {
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
              </>
            )}
          </Card>
        )}

        {selectedSession && (
          <TrainingResponsesPanel
            tenantSlug={tenantSlug}
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}

        {selectedPesquisa && (
          <CorporativaResponsesPanel
            tenantSlug={tenantSlug}
            pesquisa={selectedPesquisa}
            onClose={() => setSelectedPesquisa(null)}
          />
        )}
      </div>
    </div>
  )
}
