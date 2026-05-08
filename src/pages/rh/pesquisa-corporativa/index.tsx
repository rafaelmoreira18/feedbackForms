import { useState } from 'react'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Button from '@/components/ui/button'
import SectionHeader from '@/components/forms/section-header'
import logoMediall from '@/assets/Logo_mediall.png'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RatingValue = 1 | 2 | 3 | 4 | 5 | 'NA'

interface ItemRating {
  label: string
  value: RatingValue | null
}

interface FormData {
  fornecedor: string
  nomeRespondente: string
  cargo: string
  comunicacao: ItemRating[]
  contratacao: ItemRating[]
  recebimento: ItemRating[]
  pagamento: ItemRating[]
  imagem: ItemRating[]
  avaliacaoGeral: RatingValue | null
  recomendacao: 'sim' | 'nao' | 'talvez' | null
  pontosPositivos: string
  melhorias: string
  dificuldades: string
  comentarios: string
}

// ─── Config estática ──────────────────────────────────────────────────────────

const RATING_CONFIG: { value: RatingValue; label: string; active: string; inactive: string }[] = [
  { value: 1,    label: 'Muito insatisfeito', active: 'bg-red-base border-red-base text-white shadow-md',      inactive: 'bg-white border-gray-200 text-gray-400 hover:border-red-base hover:text-red-base' },
  { value: 2,    label: 'Insatisfeito',       active: 'bg-orange-400 border-orange-400 text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-400' },
  { value: 3,    label: 'Regular',            active: 'bg-yellow-500 border-yellow-500 text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-400 hover:border-yellow-500 hover:text-yellow-500' },
  { value: 4,    label: 'Satisfeito',         active: 'bg-teal-base border-teal-base text-white shadow-md',   inactive: 'bg-white border-gray-200 text-gray-400 hover:border-teal-base hover:text-teal-base' },
  { value: 5,    label: 'Muito satisfeito',   active: 'bg-green-base border-green-base text-white shadow-md', inactive: 'bg-white border-gray-200 text-gray-400 hover:border-green-base hover:text-green-base' },
  { value: 'NA', label: 'Não se aplica',      active: 'bg-gray-400 border-gray-400 text-white shadow-md',     inactive: 'bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-400' },
]

const SECTIONS: { key: keyof Pick<FormData, 'comunicacao' | 'contratacao' | 'recebimento' | 'pagamento' | 'imagem'>; title: string; icon: string; items: string[] }[] = [
  {
    key: 'comunicacao',
    title: 'Comunicação e relacionamento',
    icon: '💬',
    items: [
      'Clareza nas informações repassadas pela Organização',
      'Facilidade de contato com os responsáveis internos',
      'Cordialidade no relacionamento com a equipe',
      'Retorno às solicitações, dúvidas ou pendências',
      'Transparência na comunicação sobre demandas e prazos',
    ],
  },
  {
    key: 'contratacao',
    title: 'Processo de contratação e negociação',
    icon: '📄',
    items: [
      'Clareza das condições comerciais acordadas',
      'Organização do processo de compra/contratação',
      'Formalização adequada dos pedidos, contratos ou propostas',
      'Cumprimento das condições negociadas',
      'Facilidade para tratativas comerciais',
    ],
  },
  {
    key: 'recebimento',
    title: 'Recebimento de produtos e/ou serviços',
    icon: '📦',
    items: [
      'Clareza das especificações técnicas solicitadas',
      'Planejamento adequado das demandas',
      'Condições para entrega de produtos ou execução de serviços',
      'Disponibilidade da equipe para alinhamentos técnicos',
      'Tratamento dado a eventuais não conformidades',
    ],
  },
  {
    key: 'pagamento',
    title: 'Pagamento e aspectos administrativos',
    icon: '💳',
    items: [
      'Clareza quanto ao fluxo de emissão de notas fiscais',
      'Cumprimento dos prazos de pagamento acordados',
      'Facilidade de contato com o setor financeiro',
      'Organização dos documentos administrativos solicitados',
      'Resolução de pendências financeiras ou documentais',
    ],
  },
  {
    key: 'imagem',
    title: 'Imagem institucional e parceria',
    icon: '🤝',
    items: [
      'Confiança na relação com a Organização',
      'Ética e transparência no relacionamento',
      'Respeito aos acordos estabelecidos',
      'Percepção da Organização como parceira estratégica',
      'Interesse em manter ou ampliar a relação comercial',
    ],
  },
]

const OPEN_QUESTIONS: { key: keyof Pick<FormData, 'pontosPositivos' | 'melhorias' | 'dificuldades' | 'comentarios'>; label: string }[] = [
  { key: 'pontosPositivos', label: 'Quais pontos positivos você identifica no relacionamento com a Organização?' },
  { key: 'melhorias',       label: 'Quais oportunidades de melhoria você sugere?' },
  { key: 'dificuldades',    label: 'Houve alguma situação que dificultou a prestação do serviço ou fornecimento do produto?' },
  { key: 'comentarios',     label: 'Comentários adicionais' },
]

function makeItems(labels: string[]): ItemRating[] {
  return labels.map(label => ({ label, value: null }))
}

function makeInitialForm(): FormData {
  return {
    fornecedor: '',
    nomeRespondente: '',
    cargo: '',
    ...Object.fromEntries(SECTIONS.map(s => [s.key, makeItems(s.items)])),
    avaliacaoGeral: null,
    recomendacao: null,
    pontosPositivos: '',
    melhorias: '',
    dificuldades: '',
    comentarios: '',
  } as FormData
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function RatingCell({ value, selected, cfg, onClick }: {
  value: RatingValue
  selected: RatingValue | null
  cfg: typeof RATING_CONFIG[0]
  onClick: (v: RatingValue) => void
}) {
  const isActive = selected === value
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center justify-center px-2 py-2 rounded-lg border-2 font-semibold text-xs transition-all duration-150
        ${isActive ? cfg.active : cfg.inactive}`}
    >
      {value === 'NA' ? 'N/A' : value}
    </button>
  )
}

function ItemRow({ item, onChange }: {
  item: ItemRating
  onChange: (v: RatingValue) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-400 flex-1">{item.label}</p>
      <div className="flex gap-1 shrink-0">
        {RATING_CONFIG.map(cfg => (
          <RatingCell key={String(cfg.value)} value={cfg.value} selected={item.value} cfg={cfg} onClick={onChange} />
        ))}
      </div>
    </div>
  )
}

function SectionCard({ number, section, items, onChange }: {
  number: number
  section: typeof SECTIONS[0]
  items: ItemRating[]
  onChange: (idx: number, v: RatingValue) => void
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-1">
      <SectionHeader icon={section.icon} title={`${number}. ${section.title}`} />
      <div className="hidden sm:flex gap-1 justify-end mb-1 mt-2">
        {RATING_CONFIG.map(cfg => (
          <span key={String(cfg.value)} className="text-[10px] text-gray-300 w-9 text-center font-semibold">
            {cfg.value === 'NA' ? 'N/A' : cfg.value}
          </span>
        ))}
      </div>
      {items.map((item, idx) => (
        <ItemRow key={idx} item={item} onChange={v => onChange(idx, v)} />
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PesquisaCorporativaPublica() {
  const [form, setForm] = useState<FormData>(makeInitialForm)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const updateSection = (
    key: keyof Pick<FormData, 'comunicacao' | 'contratacao' | 'recebimento' | 'pagamento' | 'imagem'>,
    idx: number,
    value: RatingValue
  ) => {
    setForm(prev => {
      const items = [...prev[key]]
      items[idx] = { ...items[idx], value }
      return { ...prev, [key]: items }
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    setSubmitting(false)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-[#f4f6f9]">
        <span className="text-6xl">✅</span>
        <div>
          <p className="text-xl font-bold text-gray-400">Obrigado pela sua avaliação!</p>
          <p className="text-sm text-gray-300 mt-2">Sua resposta foi registrada com sucesso.</p>
          <p className="text-sm text-gray-300 mt-1">Sua contribuição é fundamental para a melhoria contínua da nossa gestão.</p>
        </div>
        <img src={logoMediall} alt="Mediall" className="h-10 opacity-40 mt-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Cabeçalho */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logoMediall} alt="Mediall" className="h-12 object-contain" />
          <h1 className="text-xl font-bold text-gray-400 mt-1">Pesquisa de Satisfação de Fornecedores</h1>
          <p className="text-sm font-semibold text-gray-300">Avaliação da relação com a Organização</p>
          <p className="text-xs text-gray-300 max-w-lg mt-1">
            Com o objetivo de fortalecer a relação institucional, aprimorar nossos processos de comunicação,
            negociação, entrega e parceria, solicitamos sua participação nesta pesquisa de satisfação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Identificação */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <SectionHeader icon="🏢" title="Identificação" />
            <Input label="Fornecedor" value={form.fornecedor} placeholder="Nome da empresa fornecedora"
              onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} />
            <Input label="Nome do respondente" value={form.nomeRespondente} placeholder="Seu nome completo"
              onChange={e => setForm(f => ({ ...f, nomeRespondente: e.target.value }))} />
            <Input label="Cargo / Função (opcional)" value={form.cargo} placeholder="Seu cargo ou função"
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
          </div>

          {/* Legenda */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400">Critério de avaliação</p>
            <div className="flex flex-wrap gap-2">
              {RATING_CONFIG.map(cfg => (
                <span key={String(cfg.value)} className={`text-xs px-3 py-1 rounded-full font-semibold border-2 ${cfg.active}`}>
                  {cfg.value === 'NA' ? 'NA – Não se aplica' : `${cfg.value} – ${cfg.label}`}
                </span>
              ))}
            </div>
          </div>

          {/* Seções de avaliação */}
          {SECTIONS.map((section, sIdx) => (
            <SectionCard
              key={section.key}
              number={sIdx + 1}
              section={section}
              items={form[section.key]}
              onChange={(idx, v) => updateSection(section.key, idx, v)}
            />
          ))}

          {/* Avaliação geral */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <SectionHeader icon="⭐" title="6. Avaliação geral" />

            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-400">De forma geral, qual seu nível de satisfação com a Organização?</p>
              <div className="flex gap-2 flex-wrap">
                {RATING_CONFIG.filter(c => c.value !== 'NA').map(cfg => (
                  <button
                    key={String(cfg.value)}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, avaliacaoGeral: cfg.value }))}
                    className={`flex-1 min-w-15 px-3 py-2 rounded-xl border-2 font-semibold text-xs transition-all duration-150
                      ${form.avaliacaoGeral === cfg.value ? cfg.active : cfg.inactive}`}
                  >
                    {cfg.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-400">Você recomendaria nossa Organização para outros fornecedores ou parceiros?</p>
              <div className="flex gap-2">
                {(['sim', 'nao', 'talvez'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, recomendacao: opt }))}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150
                      ${form.recomendacao === opt
                        ? 'bg-teal-base border-teal-base text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-teal-base hover:text-teal-base'}`}
                  >
                    {opt === 'nao' ? 'Não' : opt === 'sim' ? 'Sim' : 'Talvez'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questões abertas */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <SectionHeader icon="📝" title="7. Questões abertas" />
            {OPEN_QUESTIONS.map(q => (
              <Textarea
                key={q.key}
                label={q.label}
                value={form[q.key] as string}
                rows={3}
                placeholder="Sua resposta..."
                onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
              />
            ))}
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Enviando...' : 'Enviar avaliação →'}
          </Button>

          <img src={logoMediall} alt="Mediall" className="h-8 opacity-30 self-center mt-2" />
        </form>
      </div>
    </div>
  )
}
