import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { AnxietyAssessment, AnxietyClassification, AnxietyInstrument } from '@/types'
import { anxietyService } from '@/services/anxiety-service'
import { ROUTES } from '@/routes'
import {
  INSTRUMENTS,
  CLASSIFICATION_LABEL,
  CLASSIFICATION_BADGE,
} from './anxiety-constants'
import { AnxietyRespostasModal } from './anxiety-respostas-modal'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'

interface AnxietyPanelProps {
  tenantSlug: string
  assessment: AnxietyAssessment
  canManage: boolean
  canDelete: boolean
  onClose: () => void
  onDeleted: () => void
}

interface InstrumentResult {
  escore: number | null
  classificacao: AnxietyClassification | null
  respondidoEm: string | null
}

function InstrumentResultCard({
  instrument,
  result,
  onRead,
}: {
  instrument: AnxietyInstrument
  result: InstrumentResult
  onRead: () => void
}) {
  const def = INSTRUMENTS[instrument]
  const respondido = result.respondidoEm !== null

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Text variant="body-sm" className="font-semibold text-gray-400">
          {def.shortTitle} — {def.title.split('—')[1]?.trim() ?? def.title}
        </Text>
        {respondido && result.classificacao ? (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${CLASSIFICATION_BADGE[result.classificacao]}`}
          >
            {CLASSIFICATION_LABEL[result.classificacao]}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-sans bg-gray-200 text-gray-400">
            Pendente
          </span>
        )}
      </div>

      {respondido && result.escore !== null ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-400 tabular-nums">{result.escore}</span>
            <span className="text-sm text-gray-300">/ {def.maxEscore} pontos</span>
          </div>
          <button
            onClick={onRead}
            className="self-start text-xs font-semibold text-teal-base hover:text-teal-dark"
          >
            Ler respostas →
          </button>
        </>
      ) : (
        <Text variant="caption" className="text-gray-300">
          Aguardando o colaborador responder ({def.periodo}).
        </Text>
      )}
    </div>
  )
}

export function AnxietyPanel({
  tenantSlug,
  assessment,
  canManage,
  canDelete,
  onClose,
  onDeleted,
}: AnxietyPanelProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lerInstrument, setLerInstrument] = useState<AnxietyInstrument | null>(null)

  const ambosRespondidos =
    assessment.baiRespondidoEm !== null && assessment.gad7RespondidoEm !== null
  const algumRespondido =
    assessment.baiRespondidoEm !== null || assessment.gad7RespondidoEm !== null

  const copyLink = () => {
    const url = `${window.location.origin}${ROUTES.avaliacaoAnsiedade(tenantSlug, assessment.slug)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const toggleActive = useMutation({
    mutationFn: () =>
      anxietyService.update(tenantSlug, assessment.slug, { active: !assessment.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['anxiety-assessments', tenantSlug] }),
  })

  const remove = useMutation({
    mutationFn: () => anxietyService.remove(tenantSlug, assessment.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anxiety-assessments', tenantSlug] })
      onDeleted()
    },
  })

  const statusLabel = ambosRespondidos
    ? { label: 'Concluída', cls: 'bg-green-base/10 text-green-base' }
    : algumRespondido
      ? { label: 'Parcial', cls: 'bg-blue-50 text-blue-600' }
      : { label: 'Pendente', cls: 'bg-yellow-base/10 text-yellow-600' }

  return (
    <>
    <div className="rounded-2xl border-2 border-teal-base shadow-lg bg-teal-base/5">
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Text variant="heading-sm" className="text-gray-400">
                {assessment.colaboradorNome}
              </Text>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${statusLabel.cls}`}>
                {statusLabel.label}
              </span>
              {!assessment.active && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-sans bg-gray-200 text-gray-400">
                  Inativo
                </span>
              )}
            </div>
            <Text variant="body-sm" className="text-gray-300">
              {[assessment.cargo, assessment.setor].filter(Boolean).join(' · ')}
              {assessment.dataAplicacao ? ` · ${assessment.dataAplicacao}` : ''}
            </Text>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.avaliacaoAnsiedade(tenantSlug, assessment.slug))}
            >
              Abrir link
            </Button>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={toggleActive.isPending}
                onClick={() => toggleActive.mutate()}
              >
                {assessment.active ? 'Desativar' : 'Ativar'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        {/* Resultados dos dois instrumentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InstrumentResultCard
            instrument="bai"
            result={{
              escore: assessment.baiEscore,
              classificacao: assessment.baiClassificacao,
              respondidoEm: assessment.baiRespondidoEm,
            }}
            onRead={() => setLerInstrument('bai')}
          />
          <InstrumentResultCard
            instrument="gad7"
            result={{
              escore: assessment.gad7Escore,
              classificacao: assessment.gad7Classificacao,
              respondidoEm: assessment.gad7RespondidoEm,
            }}
            onRead={() => setLerInstrument('gad7')}
          />
        </div>

        {!algumRespondido && (
          <Text variant="caption" className="text-gray-300">
            Compartilhe o link com o colaborador para que ele responda os dois questionários.
          </Text>
        )}

        {/* Exclusão */}
        {canDelete && (
          <div className="pt-1">
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Text variant="body-sm" className="text-gray-400">
                  Excluir definitivamente?
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  {remove.isPending ? 'Excluindo...' : 'Confirmar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-base hover:underline"
              >
                Excluir avaliação
              </button>
            )}
          </div>
        )}
      </div>
    </div>

      {lerInstrument && (
        <AnxietyRespostasModal
          assessment={assessment}
          instrument={lerInstrument}
          onClose={() => setLerInstrument(null)}
        />
      )}
    </>
  )
}
