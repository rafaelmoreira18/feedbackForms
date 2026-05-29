// Playground de desenvolvimento — SÓ é montado quando VITE_MOCK_PERF=true.
// Permite criar e percorrer todo o fluxo da Avaliação de Desempenho usando o
// service mockado (localStorage), sem backend, banco ou login. Não vai para
// produção: a rota é registrada condicionalmente em App.tsx.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { performanceEvaluationService } from '@/services/performance-evaluation-service'
import type { PerformanceEvaluation } from '@/types'
import { AvaliacaoForm } from '@/pages/rh/avaliacao-desempenho/avaliacao-form-modal'
import { AvaliacaoPanel } from '@/pages/rh/avaliacao-desempenho/avaliacao-panel'
import { ItemRow, FolderRow } from '@/pages/rh/hub/hub-icons'
import Text from '@/components/ui/text'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'

const TENANT = 'dev'

export default function AvaliacaoPlayground() {
  const [open, setOpen] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<PerformanceEvaluation | null>(null)

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ['performance-evaluations', TENANT],
    queryFn: () => performanceEvaluationService.getAll(TENANT),
  })

  const fresh = selected
    ? avaliacoes.find((a) => a.slug === selected.slug) ?? selected
    : null

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Text variant="heading-md" className="text-gray-400">
            Playground — Avaliação de Desempenho
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            Modo mock (localStorage), sem backend. Tenant fixo: <strong>{TENANT}</strong>.
            Os links gerados abrem em <code>/{TENANT}/avaliacao-desempenho/&lt;slug&gt;</code>.
          </Text>
        </div>

        {showCreate && (
          <AvaliacaoForm
            tenantSlug={TENANT}
            onClose={() => setShowCreate(false)}
            onSaved={() => setShowCreate(false)}
          />
        )}

        {selected && fresh ? (
          <>
            <Button variant="outline" size="sm" className="self-start" onClick={() => setSelected(null)}>
              ← Voltar à lista
            </Button>
            <AvaliacaoPanel
              tenantSlug={TENANT}
              evaluation={fresh}
              canManage
              canDelete
              onClose={() => setSelected(null)}
              onDeleted={() => setSelected(null)}
            />
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Card shadow="sm" className="py-2 px-0 overflow-hidden">
            <FolderRow
              label="Avaliações de Desempenho"
              count={avaliacoes.length}
              open={open}
              depth={0}
              onToggle={() => setOpen((v) => !v)}
              action={{ label: '+ Novo', onClick: () => setShowCreate(true) }}
            />
            {open &&
              (avaliacoes.length === 0 ? (
                <ItemRow label="Nenhuma avaliação criada" depth={1} onClick={() => {}} />
              ) : (
                avaliacoes.map((a) => (
                  <ItemRow
                    key={a.id}
                    label={a.colaboradorNome}
                    depth={1}
                    onClick={() => setSelected(a)}
                  />
                ))
              ))}
          </Card>
        )}
      </div>
    </div>
  )
}
