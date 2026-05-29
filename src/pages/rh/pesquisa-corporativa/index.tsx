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

const LIKERT5_CONFIG = [
  { value: 1, label: 'Muito insatisfeito', active: 'bg-red-base border-red-base text-white shadow-md',        inactive: 'bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base' },
  { value: 2, label: 'Insatisfeito',       active: 'bg-orange-400 border-orange-400 text-white shadow-md',    inactive: 'bg-white border-gray-200 text-gray-300 hover:border-orange-400 hover:text-orange-400' },
  { value: 3, label: 'Regular',            active: 'bg-yellow-base border-yellow-base text-white shadow-md',  inactive: 'bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base' },
  { value: 4, label: 'Satisfeito',         active: 'bg-teal-base border-teal-base text-white shadow-md',      inactive: 'bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base' },
  { value: 5, label: 'Muito satisfeito',   active: 'bg-green-base border-green-base text-white shadow-md',   inactive: 'bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base' },
]


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
        className={`flex items-center justify-center px-2 sm:px-3 py-3 sm:min-h-14 rounded-xl border-2 font-semibold text-xs transition-all duration-150 w-full ${isActive ? cfg.active : cfg.inactive}`}
      >
        <span className="hidden sm:block text-center leading-tight">{cfg.label}</span>
      </button>
    </div>
  )
}

// ─── Pergunta individual ──────────────────────────────────────────────────────

function PerguntaInput({ pergunta, value, onChange, forcarObrigatoria }: {
  pergunta: PesquisaPergunta
  value: PesquisaAnswer['valor'] | undefined
  onChange: (v: PesquisaAnswer['valor']) => void
  forcarObrigatoria?: boolean
}) {
  const obrigatoria = forcarObrigatoria || pergunta.obrigatoria
  const label = obrigatoria
    ? <>{pergunta.texto} <span className="text-red-base">*</span></>
    : pergunta.texto

  if (pergunta.escala === 'likert5') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-400">{label}</p>
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
        <p className="text-sm font-semibold text-gray-400">{label}</p>
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
        label={<>{pergunta.texto}{obrigatoria && <span className="text-red-base"> *</span>}</>}
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
  const forcarObrigatoria = pesquisa.tipo === 'fornecedores'
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
                forcarObrigatoria={forcarObrigatoria}
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
  const [fornecedor, setFornecedor] = useState('')
  const [cargo, setCargo] = useState('')
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
        metadados: { fornecedor: fornecedor.trim(), cargo: cargo.trim() },
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
    const faltando: string[] = []
    if (!fornecedor.trim()) faltando.push('Fornecedor')
    if (!nome.trim()) faltando.push('Seu nome')
    if (!cargo.trim()) faltando.push('Cargo / Função')
    if (faltando.length > 0) {
      toast.error(`Preencha: ${faltando.join(', ')}`)
      return
    }
    setStep('formulario')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const todasObrigatorias = pesquisa?.tipo === 'fornecedores'
    const perguntasAValidar = pesquisa?.blocos.flatMap(b =>
      b.perguntas.filter(p => todasObrigatorias || p.obrigatoria),
    ) ?? []
    const faltando = perguntasAValidar.filter(p => {
      const v = answers[p.id]
      if (v === undefined || v === null) return true
      if (typeof v === 'number') return v === 0
      if (typeof v === 'string') return v.trim() === ''
      return false
    })
    if (faltando.length > 0) {
      toast.error(`Responda todas as perguntas (${faltando.length} pendente${faltando.length > 1 ? 's' : ''})`)
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
    <div className="min-h-screen bg-[#f4f6f9]">
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

          {/* Cabeçalho */}
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={logoMediall} alt="Mediall" className="h-12 object-contain" />
            <h1 className="text-lg font-bold text-gray-400 mt-2">{pesquisa.titulo}</h1>
            {pesquisa.periodo && <p className="text-sm text-gray-300">{pesquisa.periodo}</p>}
            <p className="text-xs text-gray-300 max-w-sm">
              Preencha com honestidade para contribuir com um ambiente melhor.
            </p>
          </div>

          {/* Metadados (antes do formulário) */}
          {step === 'metadados' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
              <SectionHeader icon="👤" title="Antes de começar" subtitle="Essas informações nos ajudam a entender melhor os resultados." />

              <Input
                label="Fornecedor *"
                type="text"
                placeholder="Nome da empresa fornecedora"
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                required
              />

              <Input
                label="Seu nome *"
                type="text"
                placeholder="Nome do respondente"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />

              <Input
                label="Cargo / Função *"
                type="text"
                placeholder="Seu cargo ou função"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                required
              />

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
  )
}
