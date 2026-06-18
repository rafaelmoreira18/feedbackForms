/** Etapas do Protocolo de Sepse, na ordem do fluxo (exclui `concluido`). */
export const SEPSE_STAGES = ['abertura', 'pacote1h', 'reavaliacao', 'desfecho'] as const;
export type SepseStageKey = (typeof SEPSE_STAGES)[number];

export const SEPSE_STAGE_META: Record<SepseStageKey, { titulo: string; equipe: string; registroLabel: string }> = {
  abertura: { titulo: 'Abertura', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  pacote1h: { titulo: 'Pacote de 1 hora', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  reavaliacao: { titulo: 'Reavaliação', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  desfecho: { titulo: 'Desfecho', equipe: 'Médico', registroLabel: 'CRM' },
};

export const SEPSE_STAGE_LABEL: Record<string, string> = {
  abertura: 'Abertura',
  pacote1h: 'Pacote 1h',
  reavaliacao: 'Reavaliação',
  desfecho: 'Desfecho',
  concluido: 'Concluído',
};

export const SEPSE_STAGE_STYLE: Record<string, string> = {
  abertura: 'bg-purple-base text-white',
  pacote1h: 'bg-blue-base text-white',
  reavaliacao: 'bg-violet-base text-white',
  desfecho: 'bg-aqua-base text-white',
  concluido: 'bg-green-base text-white',
};

// ── Rótulos do histórico de alterações (Sepse) ──────────────────────────────────
const SEPSE_CAMPO_LABEL: Record<string, string> = {
  horarioZeroHora: 'Horário zero', horarioZeroData: 'Data horário zero', classificacao: 'Classificação',
  'lactato.hora': 'Lactato (hora)', 'lactato.valor': 'Lactato (valor)', 'lactato.feito': 'Lactato',
  'hemoculturas.hora': 'Hemoculturas (hora)', 'hemoculturas.feito': 'Hemoculturas',
  'antimicrobiano.hora1aDose': 'ATM 1ª dose',
  'reposicaoVolemica.hora': 'Volume (hora)', 'reposicaoVolemica.mlTotal': 'Volume (mL)',
  'vasopressor.dose': 'Vasopressor (dose)', 'vasopressor.hora': 'Vasopressor (hora)',
  'passo3Atm.hora1aDose': 'ATM 1ª dose', 'passo3Atm.doseCalculadaMg': 'ATM dose (mg)',
  'phoenix.total': 'Phoenix total', 'phoenix.classificacao': 'Phoenix classif.',
  utiAcionadaHora: 'UTI acionada', vagaStatus: 'Vaga', encerramentoTipo: 'Encerramento', desfecho: 'Desfecho',
};

const SEPSE_VALOR_LABEL: Record<string, string> = {
  true: 'Sim', false: 'Não', '': '—',
  sepse: 'Sepse', sepse_grave: 'Sepse grave', choque_septico: 'Choque séptico',
  infeccao_sem_disfuncao: 'Infecção s/ disfunção', incompleto: 'Incompleto',
  confirmada: 'Confirmada', aguardando: 'Aguardando', na: 'N/A',
  sepse_confirmada: 'Sepse confirmada', dx_alternativo: 'Dx alternativo',
  fim_de_vida: 'Cuidados fim de vida', transferencia: 'Transferência',
  alta: 'Alta', obito: 'Óbito', evento_sentinela: 'Evento sentinela',
  frio: 'Choque frio', quente: 'Choque quente',
  adrenalina: 'Adrenalina', noradrenalina: 'Noradrenalina',
  periferico: 'Periférico', io: 'IO', central: 'Central',
  sim: 'Sim', nao: 'Não',
};

export function sepseLabelCampo(caminho: string): string {
  if (SEPSE_CAMPO_LABEL[caminho]) return SEPSE_CAMPO_LABEL[caminho];
  const ult = caminho.split('.').pop() ?? caminho;
  return ult.charAt(0).toUpperCase() + ult.slice(1).replace(/([A-Z])/g, ' $1');
}

export function sepseLabelValor(v: string): string {
  return SEPSE_VALOR_LABEL[v] ?? (v === '' ? '—' : v);
}
