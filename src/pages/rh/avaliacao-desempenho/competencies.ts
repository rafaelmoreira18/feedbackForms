// Competências da Avaliação de Desempenho — extraídas da planilha "Avaliação de
// desempenho Mediall Brasil". Agrupadas pelos 5 grupos e com a descrição (o campo
// "Justifique" / explicação da planilha). Notas vão de 0 a 10.

export interface Competency {
  id: string
  label: string
  grupo: string
  descricao: string
}

export const COMPETENCY_GROUPS = [
  'PESSOAS',
  'RESPEITO',
  'RESPONSABILIDADE',
  'RESILIÊNCIA',
  'INOVAÇÃO',
] as const

export type CompetencyGroup = (typeof COMPETENCY_GROUPS)[number]

export const COMPETENCIES: Competency[] = [
  // ── PESSOAS ──────────────────────────────────────────────────────────────────
  {
    id: 'motivacao',
    label: 'Motivação',
    grupo: 'PESSOAS',
    descricao: 'Capacidade de se auto motivar e enfrentar os desafios.',
  },
  {
    id: 'produtividade_assistencial',
    label: 'Produtividade Assistencial',
    grupo: 'PESSOAS',
    descricao:
      'Número de plantões realizados versus número de pacientes atendidos ou relatório de produtividade. Ex.: profissionais que estão em ambientes como CME.',
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    grupo: 'PESSOAS',
    descricao:
      'Facilidade em se comunicar com todos, buscando entender como os outros funcionam para ser assertivo(a), além de falar e escrever corretamente.',
  },

  // ── RESPEITO ─────────────────────────────────────────────────────────────────
  {
    id: 'trabalho_em_equipe',
    label: 'Trabalho em Equipe',
    grupo: 'RESPEITO',
    descricao:
      'É respeitoso(a) com todos, apoia a equipe e incentiva a buscar melhorias, além de interagir bem com outras áreas.',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    grupo: 'RESPEITO',
    descricao:
      'Capacidade de dar e receber feedback com humildade, clareza e visão de melhoria contínua (aplica o SQCI — Situação, Quando, Comportamento, Impacto).',
  },

  // ── RESPONSABILIDADE ─────────────────────────────────────────────────────────
  {
    id: 'adesao_processos',
    label: 'Adesão aos Processos, Protocolos, Regimento e Legislação',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Analisa problemas e toma decisões, posicionando-se e assumindo a responsabilidade por Processos, Sistemas, Controles, Resultados e Pessoas.',
  },
  {
    id: 'documentacao_pessoal',
    label: 'Documentação Pessoal / Certidões / Anuidades / CNES',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Documentação completa de acordo com o checklist; validar anuidades e certidão de antecedentes.',
  },
  {
    id: 'planejamento_organizacao',
    label: 'Planejamento / Organização',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Capacidade de gerenciar seu tempo, materiais e recursos, além de saber priorizar atividades de acordo com a urgência.',
  },
  {
    id: 'senso_urgencia',
    label: 'Senso de Urgência',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Capacidade de se atentar às demandas que estão por vir antes mesmo que alguém lhe peça algo e executá-las com antecedência.',
  },
  {
    id: 'auto_responsabilidade',
    label: 'Auto Responsabilidade',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Capacidade de reconhecer e assumir seus erros e falhas, de forma humilde e sensata, aprendendo com eles e desenvolvendo métodos para garantir a não repetição.',
  },
  {
    id: 'atualizacao_profissional',
    label: 'Atualização Profissional e Pessoal',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Atende às competências técnicas exigidas para o cargo e busca constantemente seu autoconhecimento (avaliação curricular).',
  },
  {
    id: 'pontualidade',
    label: 'Pontualidade',
    grupo: 'RESPONSABILIDADE',
    descricao:
      'Busca realizar suas entregas no prazo, além de estar na empresa sempre no horário e raramente faltar (verificar registro de ponto).',
  },

  // ── RESILIÊNCIA ──────────────────────────────────────────────────────────────
  {
    id: 'assiduidade',
    label: 'Assiduidade',
    grupo: 'RESILIÊNCIA',
    descricao: 'Número de plantões realizados de acordo com a escala.',
  },
  {
    id: 'adaptacao',
    label: 'Adaptação',
    grupo: 'RESILIÊNCIA',
    descricao:
      'Capacidade de se adequar bem a novas situações, sabe abraçar as mudanças e tem uma postura otimista.',
  },
  {
    id: 'inteligencia_emocional',
    label: 'Inteligência Emocional',
    grupo: 'RESILIÊNCIA',
    descricao:
      'Capacidade de gerir suas emoções em situações de pressão/estresse, respondendo de forma equilibrada.',
  },

  // ── INOVAÇÃO ─────────────────────────────────────────────────────────────────
  {
    id: 'orientacao_resultado',
    label: 'Orientação para Resultado',
    grupo: 'INOVAÇÃO',
    descricao:
      'Capacidade de pensar, estruturar, realizar ações e atingir metas a partir de um objetivo apresentado.',
  },
  {
    id: 'criatividade',
    label: 'Criatividade',
    grupo: 'INOVAÇÃO',
    descricao:
      'Capacidade de buscar constantemente novas formas de fazer, trazendo otimizações de tempo, produtividade ou redução de esforço físico/mental/financeiro.',
  },
  {
    id: 'resolucao_problemas',
    label: 'Resolução de Problemas',
    grupo: 'INOVAÇÃO',
    descricao:
      'Capacidade de pensar "fora da caixa", de forma mais ampla, ressignificando problemas para apresentar novas perspectivas de solução.',
  },
]

/** Competências agrupadas, na ordem dos grupos. */
export const COMPETENCIES_BY_GROUP: { grupo: CompetencyGroup; items: Competency[] }[] =
  COMPETENCY_GROUPS.map((grupo) => ({
    grupo,
    items: COMPETENCIES.filter((c) => c.grupo === grupo),
  }))

export const competencyById = (id: string): Competency | undefined =>
  COMPETENCIES.find((c) => c.id === id)
