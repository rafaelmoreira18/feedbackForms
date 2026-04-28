import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import type { PesquisaCorporativa, PesquisaPergunta, PesquisaAnswer } from '@/types'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import SectionHeader from '@/components/forms/section-header'
import logoMediall from '@/assets/Logo_mediall.png'

// ─── Escala Likert 5 — mesmo padrão de cores do ScaleButton de treinamento ───

const NOTO_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest'

const LIKERT5_CONFIG = [
  { value: 1, label: 'Discordo totalmente',    emoji: `${NOTO_BASE}/1f622/512.webp`, active: 'bg-red-base border-red-base text-white shadow-md',    inactive: 'bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base' },
  { value: 2, label: 'Discordo parcialmente',  emoji: `${NOTO_BASE}/1f614/512.webp`, active: 'bg-orange-400 border-orange-400 text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-300 hover:border-orange-400 hover:text-orange-400' },
  { value: 3, label: 'Neutro',                 emoji: `${NOTO_BASE}/1f610/512.webp`, active: 'bg-yellow-base border-yellow-base text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base' },
  { value: 4, label: 'Concordo parcialmente',  emoji: `${NOTO_BASE}/1f642/512.webp`, active: 'bg-teal-base border-teal-base text-white shadow-md',   inactive: 'bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base' },
  { value: 5, label: 'Concordo totalmente',    emoji: `${NOTO_BASE}/1f601/512.webp`, active: 'bg-green-base border-green-base text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base' },
]

const ANIM = `
@keyframes popIn {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.emoji-pop { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
`

const OPCOES_TEMPO = ['Até 6 meses', '6 meses a 1 ano', '1 a 3 anos', 'Mais de 3 anos']

// ─── Likert5 button — reutiliza mesmo padrão de ScaleButton ──────────────────

function Likert5Button({ cfg, selected, onClick }: {
  cfg: typeof LIKERT5_CONFIG[0]
  selected: number
  onClick: (v: number) => void
}) {
  const isActive = selected === cfg.value
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className={`text-[10px] sm:hidden font-semibold text-center leading-tight w-full min-h-[2.5em] flex items-end justify-center ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>
        {cfg.label}
      </span>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => onClick(isActive ? 0 : cfg.value)}
        className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 rounded-xl border-2 font-semibold text-xs transition-all duration-150 w-full ${isActive ? `h-10 sm:h-20 ${cfg.active}` : `h-10 sm:h-16 ${cfg.inactive}`}`}
      >
        {isActive && (
          <img key={`${cfg.value}-active`} src={cfg.emoji} alt={cfg.label} width={20} height={20} className="emoji-pop shrink-0" />
        )}
        <span className="hidden sm:block text-center leading-tight">{cfg.label}</span>
      </button>
    </div>
  )
}

// ─── Pergunta individual ──────────────────────────────────────────────────────

function PerguntaInput({ pergunta, value, onChange }: {
  pergunta: PesquisaPergunta
  value: PesquisaAnswer['valor'] | undefined
  onChange: (v: PesquisaAnswer['valor']) => void
}) {
  if (pergunta.escala === 'likert5') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-400">{pergunta.texto}</p>
        <div className="flex gap-2">
          {LIKERT5_CONFIG.map(cfg => (
            <Likert5Button
              key={cfg.value}
              cfg={cfg}
              selected={(value as number) ?? 0}
              onClick={v => onChange(v)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (pergunta.escala === 'opcoes') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-400">{pergunta.texto}</p>
        <div className="grid grid-cols-2 gap-2">
          {(pergunta.opcoes ?? []).map(opt => {
            const isActive = value === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150
                  ${isActive ? 'bg-teal-base border-teal-base text-white shadow-md' : 'bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base'}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (pergunta.escala === 'aberta') {
    return (
      <Textarea
        label={pergunta.texto}
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Sua resposta..."
        rows={3}
      />
    )
  }

  return null
}

// ─── Formulário por bloco ─────────────────────────────────────────────────────

function BlocoForm({ pesquisa, answers, onChange }: {
  pesquisa: PesquisaCorporativa
  answers: Record<string, PesquisaAnswer['valor']>
  onChange: (id: string, valor: PesquisaAnswer['valor']) => void
}) {
  return (
    <>
      {pesquisa.blocos.map(bloco => (
        <div key={bloco.id} className="flex flex-col gap-6">
          <SectionHeader icon="📋" title={bloco.titulo} subtitle={bloco.descricao} />
          {bloco.perguntas.map(p => (
            <div key={p.id} className="flex flex-col gap-2">
              <PerguntaInput
                pergunta={p}
                value={answers[p.id]}
                onChange={v => onChange(p.id, v)}
              />
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PesquisaCorporativaPublica() {
  const { tenantSlug, pesquisaSlug } = useParams<{ tenantSlug: string; pesquisaSlug: string }>()

  const [step, setStep] = useState<'metadados' | 'formulario' | 'enviado'>('metadados')
  const [nome, setNome] = useState('')
  const [tempo, setTempo] = useState('')
  const [answers, setAnswers] = useState<Record<string, PesquisaAnswer['valor']>>({})

  const { data: pesquisa, isLoading, error } = useQuery<PesquisaCorporativa>({
    queryKey: ['pesquisa-publica', tenantSlug, pesquisaSlug],
    queryFn: () => pesquisasCorporativasService.getPesquisaPublica(tenantSlug!, pesquisaSlug!),
    enabled: !!tenantSlug && !!pesquisaSlug,
    retry: false,
  })

  const submit = useMutation({
    mutationFn: () => {
      const answersArray: PesquisaAnswer[] = Object.entries(answers).map(([perguntaId, valor]) => ({ perguntaId, valor }))
      return pesquisasCorporativasService.submitResposta(tenantSlug!, pesquisaSlug!, {
        nomeRespondente: nome.trim() || 'Anônimo',
        metadados: { tempoDeEmpresa: tempo },
        answers: answersArray,
      })
    },
    onSuccess: () => setStep('enviado'),
    onError: () => toast.error('Erro ao enviar resposta. Tente novamente.'),
  })

  const handleAnswer = (id: string, valor: PesquisaAnswer['valor']) => {
    setAnswers(prev => ({ ...prev, [id]: valor }))
  }

  const handleIniciar = () => {
    if (!tempo) { toast.error('Selecione seu tempo de empresa'); return }
    setStep('formulario')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const obrigatorias = pesquisa?.blocos.flatMap(b => b.perguntas.filter(p => p.obrigatoria)) ?? []
    const faltando = obrigatorias.filter(p => answers[p.id] === undefined || answers[p.id] === '' || answers[p.id] === 0)
    if (faltando.length > 0) {
      toast.error(`Responda todas as perguntas obrigatórias (${faltando.length} pendente${faltando.length > 1 ? 's' : ''})`)
      return
    }
    submit.mutate()
  }

  // ── Loading / erro ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !pesquisa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">🔍</span>
        <p className="text-gray-400 font-semibold">Pesquisa não encontrada</p>
        <p className="text-sm text-gray-300">O link pode estar incorreto ou a pesquisa foi desativada.</p>
      </div>
    )
  }

  if (!pesquisa.ativa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">🔒</span>
        <p className="text-gray-400 font-semibold">Esta pesquisa está encerrada</p>
        <p className="text-sm text-gray-300">O período de respostas foi finalizado.</p>
      </div>
    )
  }

  // ── Enviado ───────────────────────────────────────────────────────────────

  if (step === 'enviado') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-6xl">✅</span>
        <div>
          <p className="text-xl font-bold text-gray-400">Obrigado pela sua participação!</p>
          <p className="text-sm text-gray-300 mt-2">Sua resposta foi registrada com sucesso.</p>
          <p className="text-sm text-gray-300 mt-1">Suas respostas são anônimas e contribuem para um ambiente melhor.</p>
        </div>
        <img src={logoMediall} alt="Mediall" className="h-10 opacity-40 mt-4" />
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{ANIM}</style>
      <div className="min-h-screen bg-[#f4f6f9]">
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

          {/* Cabeçalho */}
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={logoMediall} alt="Mediall" className="h-12 object-contain" />
            <h1 className="text-lg font-bold text-gray-400 mt-2">{pesquisa.titulo}</h1>
            {pesquisa.periodo && <p className="text-sm text-gray-300">{pesquisa.periodo}</p>}
            <p className="text-xs text-gray-300 max-w-sm">
              Suas respostas são anônimas. O nome é opcional. Preencha com honestidade para contribuir com um ambiente melhor.
            </p>
          </div>

          {/* Metadados (antes do formulário) */}
          {step === 'metadados' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
              <SectionHeader icon="👤" title="Antes de começar" subtitle="Essas informações nos ajudam a entender melhor os resultados." />

              <Input
                label="Seu nome (opcional)"
                type="text"
                placeholder="Deixe em branco para anonimato"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-400">
                  Tempo de empresa <span className="text-red-base">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {OPCOES_TEMPO.map(opt => {
                    const isActive = tempo === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTempo(opt)}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150
                          ${isActive ? 'bg-teal-base border-teal-base text-white shadow-md' : 'bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base'}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button onClick={handleIniciar} className="w-full">
                Iniciar pesquisa →
              </Button>
            </div>
          )}

          {/* Formulário */}
          {step === 'formulario' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <BlocoForm pesquisa={pesquisa} answers={answers} onChange={handleAnswer} />

              <Button type="submit" className="w-full" disabled={submit.isPending}>
                {submit.isPending ? 'Enviando...' : 'Enviar pesquisa →'}
              </Button>
            </form>
          )}

        </div>
      </div>
    </>
  )
}
