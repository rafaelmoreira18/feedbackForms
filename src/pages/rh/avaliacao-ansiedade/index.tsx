import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { anxietyService } from '@/services/anxiety-service'
import type { AnxietyAssessmentPublicView, AnxietyInstrument } from '@/types'
import { INSTRUMENTS } from './anxiety-constants'
import Button from '@/components/ui/button'

// ─── Botão da escala 0..3 ────────────────────────────────────────────────────────

const VALUE_ACTIVE: Record<number, string> = {
  0: 'bg-green-base border-green-base text-white shadow-md',
  1: 'bg-teal-base border-teal-base text-white shadow-md',
  2: 'bg-orange-400 border-orange-400 text-white shadow-md',
  3: 'bg-red-base border-red-base text-white shadow-md',
}
const VALUE_INACTIVE: Record<number, string> = {
  0: 'bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base',
  1: 'bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base',
  2: 'bg-white border-gray-200 text-gray-300 hover:border-orange-400 hover:text-orange-400',
  3: 'bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base',
}

// ─── Formulário de um instrumento ────────────────────────────────────────────────

interface InstrumentFormProps {
  instrument: AnxietyInstrument
  position: number
  total: number
  submitting: boolean
  onSubmit: (answers: { itemId: number; value: number }[]) => void
}

function InstrumentForm({ instrument, position, total, submitting, onSubmit }: InstrumentFormProps) {
  const def = INSTRUMENTS[instrument]
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showError, setShowError] = useState(false)

  const setAnswer = (itemId: number, value: number) =>
    setAnswers((prev) => ({ ...prev, [itemId]: value }))

  const allAnswered = def.itens.every((_, i) => answers[i + 1] !== undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnswered) {
      setShowError(true)
      return
    }
    onSubmit(def.itens.map((_, i) => ({ itemId: i + 1, value: answers[i + 1] })))
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-teal-base uppercase tracking-wide">
          Questionário {position} de {total} · {def.shortTitle}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-gray-400 font-sans">{def.title}</h2>
        <p className="text-sm text-gray-300 font-sans">{def.instrucoes}</p>

        {/* Legenda da escala */}
        <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-3 mt-1">
          {def.opcoes.map((o) => (
            <div key={o.value} className="flex items-baseline gap-2 text-xs">
              <span className="w-5 h-5 shrink-0 rounded-md bg-gray-200 text-gray-500 font-bold flex items-center justify-center">
                {o.value}
              </span>
              <span className="text-gray-400 font-semibold">{o.label}</span>
              {o.descricao && <span className="text-gray-300">— {o.descricao}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {def.itens.map((item, i) => {
          const itemId = i + 1
          const val = answers[itemId]
          return (
            <div key={itemId} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-400 font-sans">
                {itemId}. {item}
              </p>
              <div className="flex gap-2">
                {def.opcoes.map((o) => {
                  const isActive = val === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      title={o.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setAnswer(itemId, o.value)}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${
                        isActive ? VALUE_ACTIVE[o.value] : VALUE_INACTIVE[o.value]
                      }`}
                    >
                      {o.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showError && !allAnswered && (
        <p className="text-sm text-red-base font-sans">
          Por favor, responda todos os itens antes de enviar.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full text-base font-bold tracking-wide" disabled={submitting}>
        {submitting ? 'Enviando...' : position < total ? 'Continuar →' : 'Enviar →'}
      </Button>
    </form>
  )
}

// ─── Telas auxiliares ────────────────────────────────────────────────────────────

function CenteredCard({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">{title}</h2>
        <p className="text-gray-300 font-sans text-sm">{message}</p>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────────

export default function AvaliacaoAnsiedadePublica() {
  const { tenantSlug = '', slug = '' } = useParams<{ tenantSlug: string; slug: string }>()
  const [view, setView] = useState<AnxietyAssessmentPublicView | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!tenantSlug || !slug) {
      setNotFound(true)
      setLoading(false)
      return
    }
    anxietyService
      .getPublic(tenantSlug, slug)
      .then(setView)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [tenantSlug, slug])

  // Instrumentos ainda pendentes, em ordem fixa (BAI → GAD-7)
  const pending = useMemo<AnxietyInstrument[]>(() => {
    if (!view) return []
    const list: AnxietyInstrument[] = []
    if (view.baiPendente) list.push('bai')
    if (view.gad7Pendente) list.push('gad7')
    return list
  }, [view])

  const handleSubmit = async (answers: { itemId: number; value: number }[]) => {
    const instrument = pending[step]
    setSubmitting(true)
    try {
      await anxietyService.submit(tenantSlug, slug, { instrument, answers })
      if (step + 1 >= pending.length) setDone(true)
      else setStep((s) => s + 1)
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !view) {
    return (
      <CenteredCard
        icon="🔍"
        title="Avaliação não encontrada"
        message="Este link pode ter expirado ou sido desativado."
      />
    )
  }

  if (!view.active) {
    return (
      <CenteredCard
        icon="🔒"
        title="Link inativo"
        message="Esta avaliação foi encerrada. Obrigado!"
      />
    )
  }

  if (done || pending.length === 0) {
    return (
      <CenteredCard
        icon="✅"
        title="Respostas registradas"
        message="Obrigado por responder. Suas respostas foram enviadas com segurança ao RH."
      />
    )
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">
            Avaliação de Ansiedade
          </h1>
          <p className="text-gray-300 font-sans mt-1 text-sm">
            {[view.cargo, view.setor].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

          {!started ? (
            <div className="p-5 sm:p-8 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-gray-400 font-sans">
                  Olá, {view.colaboradorNome}
                </h2>
                <p className="text-sm text-gray-300 font-sans">
                  Você vai responder {pending.length === 2 ? 'dois questionários curtos' : 'um questionário curto'} sobre
                  como tem se sentido recentemente. Não há respostas certas ou erradas — responda com
                  sinceridade. Suas respostas são confidenciais.
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
                Começar →
              </Button>
            </div>
          ) : (
            <InstrumentForm
              key={pending[step]}
              instrument={pending[step]}
              position={step + 1}
              total={pending.length}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <p className="text-center text-xs text-gray-300 font-sans mt-4 pb-2">
          Recursos Humanos · Confidencial
        </p>
      </div>
    </div>
  )
}
