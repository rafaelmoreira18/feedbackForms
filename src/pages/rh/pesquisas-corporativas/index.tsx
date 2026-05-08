import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import { tenantService } from '@/services/tenant-service'
import type { PesquisaCorporativa, PesquisaMetricas } from '@/types'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import MetricCard from '@/components/ui/metric-card'
import Select from '@/components/ui/select'
import { ROUTES } from '@/routes'
import { PesquisaCard } from './pesquisa-table'
import { EditModal } from './pesquisa-form-modal'
import { ResponsesPanel } from './pesquisa-respostas'

function groupByCategoria(pesquisas: PesquisaCorporativa[]): [string, PesquisaCorporativa[]][] {
  const map = new Map<string, PesquisaCorporativa[]>()
  for (const p of pesquisas) {
    const key = p.categoria ?? 'Geral'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).sort(([a], [b]) =>
    a === 'Geral' ? 1 : b === 'Geral' ? -1 : a.localeCompare(b, 'pt-BR'),
  )
}

export default function PesquisasCorporativas() {
  const { tenantSlug: slugFromUrl = '' } = useParams<{ tenantSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isGlobal = !slugFromUrl
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? '')
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl

  const [searchParams] = useSearchParams()
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
  const canManage = user?.role === 'holding_admin' || (user?.role === 'rh_admin' && !user?.tenantId)

  useEffect(() => {
    const slug = searchParams.get('pesquisa')
    if (!slug || pesquisas.length === 0) return
    const found = pesquisas.find(p => p.slug === slug)
    if (found) setSelectedPesquisa(found)
  }, [pesquisas, searchParams])

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
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Text variant="heading-md" className="text-gray-400">Pesquisas Corporativas</Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">{user?.name}</Text>
          <Button variant="outline" size="sm" onClick={() => navigate(
            tenantSlug ? ROUTES.rhHub(tenantSlug) : ROUTES.rhHubGlobal
          )}>
            ← RH
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
          <div className="flex flex-col gap-6">
            <PesquisaCard
              pesquisa={selectedPesquisa}
              tenantSlug={tenantSlug}
              isSelected
              copied={copied}
              toggleAtivaPending={toggleAtiva.isPending}
              canManage={canManage}
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
                  <MetricCard title="Média Geral" value={metricas.mediaGeral.toFixed(1)} subtitle="Escala 1–5" />
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
          <div className="flex flex-col gap-6">
            {groupByCategoria(pesquisas).map(([categoria, items]) => (
              <div key={categoria} className="flex flex-col gap-3">
                <Text variant="body-sm-bold" className="text-gray-300 uppercase tracking-wide">
                  {categoria}
                </Text>
                {items.map(p => (
                  <PesquisaCard
                    key={p.id}
                    pesquisa={p}
                    tenantSlug={tenantSlug}
                    isSelected={false}
                    copied={copied}
                    toggleAtivaPending={toggleAtiva.isPending}
                    canManage={canManage}
                    canDelete={isHoldingAdmin}
                    onSelect={() => handleSelect(p)}
                    onCopy={copyLink}
                    onToggleAtiva={p => toggleAtiva.mutate(p)}
                    onNavigate={() => window.open(`/${tenantSlug}/pesquisa-corporativa/${p.slug}`, '_blank')}
                    onEdit={() => setEditTarget(p)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
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
