import type { AnxietyAssessment, AnxietyInstrument } from '@/types'
import {
  INSTRUMENTS,
  CLASSIFICATION_LABEL,
  CLASSIFICATION_BADGE,
  VALUE_BADGE,
} from './anxiety-constants'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'

interface AnxietyRespostasModalProps {
  assessment: AnxietyAssessment
  instrument: AnxietyInstrument
  onClose: () => void
}

export function AnxietyRespostasModal({
  assessment,
  instrument,
  onClose,
}: AnxietyRespostasModalProps) {
  const def = INSTRUMENTS[instrument]
  const respostas = instrument === 'bai' ? assessment.baiRespostas : assessment.gad7Respostas
  const escore = instrument === 'bai' ? assessment.baiEscore : assessment.gad7Escore
  const classificacao =
    instrument === 'bai' ? assessment.baiClassificacao : assessment.gad7Classificacao

  const valorPorItem = new Map((respostas ?? []).map((r) => [r.itemId, r.value]))
  const opcaoPorValor = new Map(def.opcoes.map((o) => [o.value, o]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Text as="h2" variant="heading-sm" className="text-gray-400">
              {def.shortTitle} — Respostas
            </Text>
            <Text variant="body-sm" className="text-gray-300">
              {assessment.colaboradorNome} · {def.periodo}
            </Text>
          </div>
          {escore !== null && classificacao && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xl font-bold text-gray-400 tabular-nums">
                {escore}
                <span className="text-sm text-gray-300"> / {def.maxEscore}</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${CLASSIFICATION_BADGE[classificacao]}`}
              >
                {CLASSIFICATION_LABEL[classificacao]}
              </span>
            </div>
          )}
        </div>

        {/* Lista de itens (rolável) */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          {def.itens.map((item, i) => {
            const itemId = i + 1
            const valor = valorPorItem.get(itemId)
            const opcao = valor !== undefined ? opcaoPorValor.get(valor) : undefined
            return (
              <div
                key={itemId}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
              >
                <span className="text-sm text-gray-400">
                  {itemId}. {item}
                </span>
                {opcao ? (
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${VALUE_BADGE[opcao.value]}`}
                  >
                    {opcao.value} · {opcao.label}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-gray-300">—</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
