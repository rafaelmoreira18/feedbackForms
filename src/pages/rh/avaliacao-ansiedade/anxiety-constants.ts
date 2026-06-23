import type { AnxietyClassification, AnxietyInstrument } from '@/types'

// ─── Opções (escala Likert 0..3) ────────────────────────────────────────────────

export interface AnxietyOption {
  value: number
  label: string
  /** Âncora descritiva adicional (BAI). */
  descricao?: string
}

/** BAI: 0 Absolutamente não · 1 Levemente · 2 Moderadamente · 3 Gravemente */
const BAI_OPCOES: AnxietyOption[] = [
  { value: 0, label: 'Absolutamente não' },
  { value: 1, label: 'Levemente', descricao: 'Não me incomodou muito' },
  { value: 2, label: 'Moderadamente', descricao: 'Foi muito desagradável mas pude suportar' },
  { value: 3, label: 'Gravemente', descricao: 'Dificilmente pude suportar' },
]

/** GAD-7: 0 Nenhuma vez · 1 Vários dias · 2 Mais da metade dos dias · 3 Quase todos os dias */
const GAD7_OPCOES: AnxietyOption[] = [
  { value: 0, label: 'Nenhuma vez' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
]

// ─── Itens ───────────────────────────────────────────────────────────────────────

const BAI_ITENS: string[] = [
  'Dormência ou formigamento',
  'Sensação de calor',
  'Tremores nas pernas',
  'Incapaz de relaxar',
  'Medo que aconteça o pior',
  'Atordoado ou tonto',
  'Palpitação ou aceleração do coração',
  'Sem equilíbrio',
  'Aterrorizado',
  'Nervoso',
  'Sensação de sufocação',
  'Tremores nas mãos',
  'Trêmulo',
  'Medo de perder o controle',
  'Dificuldade de respirar',
  'Medo de morrer',
  'Assustado',
  'Indigestão ou desconforto no abdômen',
  'Sensação de desmaio',
  'Rosto afogueado',
  'Suor (não devido ao calor)',
]

const GAD7_ITENS: string[] = [
  'Sentir-se nervoso/a, ansioso/a ou muito tenso/a',
  'Não ser capaz de impedir ou de controlar as preocupações',
  'Preocupa-se muito com diversas coisas',
  'Dificuldade para relaxar',
  'Ficar tão agitado/a que se torna difícil permanecer sentado',
  'Ficar facilmente aborrecido/a ou irritado/a',
  'Sentir medo como se algo horrível fosse acontecer',
]

// ─── Definição dos instrumentos ──────────────────────────────────────────────────
// As faixas de classificação vivem APENAS no backend (anxiety-scoring.ts), que é a
// fonte única do escore/classificação. Aqui só descrevemos itens, escala e o máximo.

export interface InstrumentDef {
  key: AnxietyInstrument
  /** Título completo do instrumento. */
  title: string
  /** Rótulo curto para chips/cabeçalhos. */
  shortTitle: string
  periodo: string
  instrucoes: string
  itens: string[]
  opcoes: AnxietyOption[]
  maxEscore: number
}

export const INSTRUMENTS: Record<AnxietyInstrument, InstrumentDef> = {
  bai: {
    key: 'bai',
    title: 'BAI — Inventário de Ansiedade de Beck',
    shortTitle: 'BAI',
    periodo: 'última semana',
    instrucoes:
      'Identifique o quanto você tem sido incomodado por cada sintoma durante a ÚLTIMA SEMANA, incluindo hoje.',
    itens: BAI_ITENS,
    opcoes: BAI_OPCOES,
    maxEscore: 63,
  },
  gad7: {
    key: 'gad7',
    title: 'GAD-7 — Transtorno de Ansiedade Generalizada',
    shortTitle: 'GAD-7',
    periodo: 'últimas 2 semanas',
    instrucoes:
      'Indique com que frequência você se sentiu incomodado por cada sintoma nas ÚLTIMAS 2 SEMANAS.',
    itens: GAD7_ITENS,
    opcoes: GAD7_OPCOES,
    maxEscore: 21,
  },
}

// ─── Rótulos e cores de classificação ────────────────────────────────────────────

export const CLASSIFICATION_LABEL: Record<AnxietyClassification, string> = {
  minima: 'Mínima',
  leve: 'Leve',
  moderada: 'Moderada',
  grave: 'Grave',
}

export const CLASSIFICATION_BADGE: Record<AnxietyClassification, string> = {
  minima: 'bg-green-base/10 text-green-base',
  leve: 'bg-teal-base/10 text-teal-dark',
  moderada: 'bg-orange-100 text-orange-600',
  grave: 'bg-red-base/10 text-red-base',
}

/** Cor do chip da resposta escolhida (0..3), por gravidade crescente. */
export const VALUE_BADGE: Record<number, string> = {
  0: 'bg-green-base/10 text-green-base',
  1: 'bg-teal-base/10 text-teal-dark',
  2: 'bg-orange-100 text-orange-600',
  3: 'bg-red-base/10 text-red-base',
}
