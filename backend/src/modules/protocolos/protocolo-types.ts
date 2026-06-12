/**
 * Tipos de domínio do Protocolo de Dor Torácica (FORMMED027).
 * Separados da entity TypeORM — esta é a forma dos dados (blocos JSONB), não o
 * mapeamento de colunas. Mantidos em sincronia manual com o frontend (src/types).
 */

/**
 * Etapa/bloco corrente do protocolo. O preenchimento é sequencial e cada bloco,
 * ao ser fechado, libera o próximo. Só o fechamento de `desfecho` conclui o protocolo.
 *
 *   triagem      — aberto; aguardando a Triagem (cabeçalho + ETAPA 1: sinais vitais/queixa/Manchester)
 *   ecg          — Triagem fechada; aguardando o ECG (ETAPA 2 — feita em horário diferente)
 *   investigacao — ECG fechado; aguardando Investigação (ETAPA 3 + HEART + Dx diferenciais)
 *   desfecho     — Investigação fechada; aguardando Desfecho (ETAPA 5 + ETAPA 6 + assinaturas)
 *   concluido    — Desfecho fechado OU encerrado pelo médico; protocolo encerrado
 */
export type ProtocoloStage =
  | 'triagem'
  | 'ecg'
  | 'investigacao'
  | 'desfecho'
  | 'concluido';

/** Bloco preenchível (etapa com formulário). */
export type BlocoKey = 'triagem' | 'ecg' | 'investigacao' | 'desfecho';

/** Profissional que fechou um bloco (nome + nº de cadastro profissional: CRM/COREN/etc.) */
export interface ResponsavelBloco {
  responsavelNome: string;
  registroProfissional: string;
  /** ISO datetime do fechamento do bloco */
  fechadoEm: string;
}

// ── BLOCO 1 — TRIAGEM (ETAPA 1) ───────────────────────────────────────────────
export interface SinaisVitais {
  paMsd: string; // ex.: "120/80"
  paMse: string;
  fc: string; // bpm
  fr: string; // ipm
  spo2: string; // %
  tax: string; // °C
  glicemia: string; // mg/dL
}

export interface QueixaPrincipal {
  dorToracica: boolean;
  dispneiaSubita: boolean;
  sudoreseNauseaSincope: boolean;
  dorIrradiada: boolean; // braço, mandíbula, epigástrio
}

export type ResultadoEcg = 'via_i' | 'via_ii' | 'via_iii' | '';

export interface DerivacoesExtras {
  v3rV4r: boolean;
  v7v9: boolean;
  ecgSeriado: boolean;
}

export interface BlocoTriagem extends ResponsavelBloco {
  inicioTriagem: string; // "HH:mm"
  classificacaoManchester: 'vermelho' | 'laranja' | '';
  sinaisVitais: SinaisVitais;
  queixaPrincipal: QueixaPrincipal;
  inicioSintomasData: string; // "YYYY-MM-DD"
  inicioSintomasHora: string; // "HH:mm"
  alergias: boolean;
  alergiasDescricao: string;
  instabilidade: boolean; // se SIM → Sala Vermelha
}

// ── BLOCO ECG (ETAPA 2 — realizada em horário separado da triagem) ────────────
export interface BlocoEcg extends ResponsavelBloco {
  primeiroEcgHora: string; // "HH:mm"
  interpretacaoMedicaHora: string; // "HH:mm"
  resultadoEcg: ResultadoEcg;
  derivacoesExtras: DerivacoesExtras;
}

// ── BLOCO 2 — INVESTIGAÇÃO (Troponina + HEART + Dx diferenciais) ──────────────
export interface ColetaTroponina {
  horaColeta: string; // "HH:mm"
  resultado: string; // ng/mL
  horaResultadoLab: string; // "HH:mm"
}

export type FaixaRiscoHeart = 'baixo' | 'intermediario' | 'alto' | '';

export interface DiagnosticosDiferenciais {
  /** Nenhum diagnóstico diferencial se aplica ao paciente. Exclui os demais. */
  naoSeAplica: boolean;
  dissecaoAorta: boolean;
  dissecaoAortaAddRs: string;
  tep: boolean;
  tepWells: string;
  pericardite: boolean;
  takotsubo: boolean;
  pneumotorax: boolean;
  tamponamento: boolean;
}

export interface BlocoInvestigacao extends ResponsavelBloco {
  // Troponina convencional 0-3-6h
  lsnUnidade: string; // ng/mL
  coleta0h: ColetaTroponina;
  coleta3h: ColetaTroponina;
  coleta3hDeltaPct: string; // (3h-0h)/0h × 100
  coleta6h: ColetaTroponina;
  troponinaInterpretacao: 'rule_in' | 'rule_out' | 'inconclusivo' | '';
  // Escore HEART (cada item 0/1/2)
  heartH: number;
  heartE: number;
  heartA: number;
  heartR: number;
  heartT: number;
  heartTotal: number; // 0-10
  heartFaixaRisco: FaixaRiscoHeart;
  condutaHeart: 'alta_segura' | 'observacao' | 'internacao' | '';
  // Diagnósticos diferenciais
  diagnosticos: DiagnosticosDiferenciais;
}

// ── BLOCO 3 — DESFECHO (Trombólise + Encaminhamento + assinaturas) ────────────
export interface CriteriosReperfusao {
  resolucaoSt50: boolean;
  eva3: boolean;
  arritmiaReperfusao: boolean;
}

export interface MedidasAdmissao {
  aas: boolean;
  p2y12: boolean;
  anticoagulante: boolean;
  monitorizacao: boolean;
  o2: boolean;
}

export interface PrescricoesAlta {
  aas: boolean;
  p2y12: boolean;
  estatina: boolean;
  betabloqueador: boolean;
  iecaBra: boolean;
}

export type DestinoPaciente =
  | 'alta_ambulatorial'
  | 'observacao'
  | 'internacao_uti'
  | 'transferencia_icp'
  | 'transferencia_uti_referencia'
  | 'obito'
  | '';

export interface AltaSeguraCriterios {
  heart3TropNeg: boolean;
  ecgSemIsquemia: boolean;
  semInstabilidade: boolean;
  daaTepAfastados: boolean;
  seguimentoAgendado: boolean;
  orientacoesEntregues: boolean;
}

export interface BlocoDesfecho extends ResponsavelBloco {
  // ETAPA 5 — Trombólise (VIA I)
  trombolitiseElegivel: boolean;
  trombolitiseMotivoNao: string;
  inicioFibrinolitico: string; // "HH:mm"
  tempoPortaAgulhaMin: string; // min (também derivável de horas)
  criteriosReperfusao: CriteriosReperfusao;
  eficaciaTrombolise: 'sucesso' | 'falha' | '';
  medidasAdmissao: MedidasAdmissao;
  prescricoesAlta: PrescricoesAlta;
  // ETAPA 6 — Encaminhamento final
  destino: DestinoPaciente;
  obitoData: string; // "YYYY-MM-DD"
  obitoHora: string; // "HH:mm"
  solicitacaoRegulacaoHora: string; // "HH:mm"
  confirmacaoVagaHora: string; // "HH:mm"
  saidaEfetivaHora: string; // "HH:mm"
  altaSeguraCriterios: AltaSeguraCriterios;
  // Assinaturas
  enfermeiroNomeCoren: string;
  medicoNomeCrm: string;
}

// ── Encerramento antecipado (médico) ──────────────────────────────────────────
export type MotivoEncerramento = 'nao_continuidade' | 'nao_indicacao' | '';

export interface EncerramentoProtocolo {
  motivo: MotivoEncerramento;
  observacao: string;
  /** Etapa em que o protocolo estava ao ser encerrado. */
  etapaNoEncerramento: ProtocoloStage;
  encerradoPorNome: string;
  encerradoPorRegistro: string;
  encerradoPorUserId: string | null;
  encerradoEm: string; // ISO datetime
}

/** Uma alteração de campo (par de/para) dentro de uma ação. */
export interface AlteracaoCampo {
  bloco: BlocoKey;
  campo: string; // caminho do campo, ex.: "sinaisVitais.fc"
  de: string;
  para: string;
  porUserId: string | null;
  porNome: string;
  em: string; // ISO datetime
}

/**
 * Registro de uma ação sobre uma etapa (fechamento ou edição posterior), com autor,
 * registro profissional, horário e os campos que mudaram. É o que o usuário final vê
 * de forma resumida ("X fechou", "Y alterou (N campos)").
 */
export interface RegistroAcao {
  tipo: 'fechamento' | 'edicao';
  bloco: BlocoKey;
  porNome: string;
  porRegistro: string;
  porUserId: string | null;
  em: string; // ISO datetime
  campos: { campo: string; de: string; para: string }[];
}
