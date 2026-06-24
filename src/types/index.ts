export type UserRole =
  | 'holding_admin'
  | 'hospital_admin'
  | 'viewer'
  | 'operator_forms'
  | 'rh_admin'
  | 'protocolo_admin_global'
  | 'protocolo_admin'
  | 'protocolo_operador'
  | 'protocolo_medico';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Protocolos: registro do conselho (CRM/COREN). Vazio para usuários de outros sistemas. */
  registroProfissional?: string;
  tenantId: string | null;
  tenantSlug: string | null;
  mustChangePassword?: boolean;
}

// JWT payload contract — must match LinenSistem backend
export interface JWTPayload {
  sub: string
  email: string
  nome: string
  role: UserRole
  tenantId: string | null
  tenantSlug: string | null
}

// ─── Tenant ────────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
  /** Modo padrão do resultado de troponina (Dor Torácica) para novas coletas. */
  troponinaModoPadrao?: ModoColeta;
}

// ─── Form Template (API-driven form config) ─────────────────────────────────

export type QuestionScale = 'rating4' | 'nps';

export interface FormQuestion {
  id: string;
  questionKey: string;
  text: string;
  scale: QuestionScale;
  subReasons: [string, string, string] | null;
  order: number;
}

export interface FormTemplateBlock {
  id: string;
  title: string;
  order: number;
  questions: FormQuestion[];
}

export interface FormTemplate {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  active: boolean;
  blocks: FormTemplateBlock[];
}

// ─── Sistemas ─────────────────────────────────────────────────────────────────

export const SISTEMAS_KEYS = ['feedbackforms', 'linensistem'] as const;

export type SistemaKey = (typeof SISTEMAS_KEYS)[number];

// ─── CPF Justificativas ────────────────────────────────────────────────────────

export const CPF_JUSTIFICATIVAS = [
  'Paciente não possui CPF',
  'Paciente não soube informar',
  'Responsável não soube informar',
  'Paciente estrangeiro',
  'Recusa em informar',
  'Documento não estava disponível',
] as const;

export type CpfJustificativa = (typeof CPF_JUSTIFICATIVAS)[number];

// ─── Form 3: Dynamic Department Feedback ──────────────────────────────────────

export type Form3Type =
  | 'Internação Hospitalar'
  | 'Exames Laboratoriais e de Imagem'
  | 'Ambulatório'
  | 'UTI'
  | 'Pronto Socorro'
  | 'Hemodiálise'
  | 'Centro Cirúrgico';

export interface Form3Answer {
  questionId: string;
  value: number;
  reasons?: string[];
  note?: string;
}

export interface Form3Response {
  id: string;
  /** Matches FormTemplate.slug — dynamic, no hardcoded enum */
  formType: string;
  patientName: string;
  /** Masked CPF (e.g. "123.***.***-45") or null when not provided at submission. */
  patientCpf: string | null;
  /** Reason for not providing CPF. Populated when patientCpf is null. */
  cpfJustificativa: CpfJustificativa | null;
  /** Set when a holding_admin adds the CPF retroactively. */
  cpfAddedAt: string | null;
  patientAge: number;
  patientGender: 'Masculino' | 'Feminino' | 'Outro';
  admissionDate: string;
  dischargeDate: string;
  evaluatedDepartment: string;
  answers: Form3Answer[];
  comments: string;
  recusouResponder: boolean;
  createdAt: string;
}

export interface Form3Filters {
  startDate?: string;
  endDate?: string;
  sortSatisfaction?: 'asc' | 'desc';
  formType?: string;
  evaluatedDepartment?: string;
  page?: number;
}

export type MetricsView = 'satisfacao' | 'avaliacao' | 'ambos';

export interface Form3Metrics {
  totalResponses: number;
  averageSatisfaction: number;
  averageSatisfactionOnly: number;
  averageExperience: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
  averageNps: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Training Sessions ─────────────────────────────────────────────────────────

export type TrainingType = 'eficacia' | 'reacao';

export interface TrainingSession {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  trainingDate: string;
  trainingType: TrainingType;
  instructor: string;
  active: boolean;
  createdAt: string;
  /** Set on eficácia sessions created via create-eficacia endpoint; null for reação and legacy standalone sessions */
  linkedSessionId: string | null;
}

export interface CreateTrainingSessionDto {
  title: string;
  trainingDate: string;
  trainingType: TrainingType;
  instructor: string;
}

// ─── Avaliação de Desempenho ───────────────────────────────────────────────────

/**
 * pendente               — criada; aguardando a avaliação do gestor
 * aguardando_colaborador — gestor respondeu; aguardando a autoavaliação do colaborador
 * concluida              — ambos responderam; relatório (radar) disponível
 */
export type PerformanceEvaluationStatus =
  | 'pendente'
  | 'aguardando_colaborador'
  | 'concluida';

export interface PerformanceAnswer {
  competenciaId: string;
  /** nota de 0 a 10 */
  valor: number;
  justificativa: string;
}

export interface PerformanceEvaluation {
  id: string;
  tenantId: string;
  createdByUserId: string | null;
  slug: string;
  colaboradorNome: string;
  setor: string;
  cargo: string;
  gestorArea: string;
  projeto: string;
  avaliador: string;
  dataAvaliacao: string;
  status: PerformanceEvaluationStatus;
  managerAnswers: PerformanceAnswer[] | null;
  selfAnswers: PerformanceAnswer[] | null;
  managerSubmittedAt: string | null;
  selfSubmittedAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreatePerformanceEvaluationDto {
  colaboradorNome: string;
  setor: string;
  cargo: string;
  gestorArea: string;
  avaliador: string;
  dataAvaliacao: string;
  projeto?: string;
}

// ─── Avaliação de Ansiedade (BAI / GAD-7) ───────────────────────────────────────

export type AnxietyInstrument = 'bai' | 'gad7';

export type AnxietyClassification = 'minima' | 'leve' | 'moderada' | 'grave';

export interface AnxietyAnswer {
  /** índice do item: 1..21 (BAI) ou 1..7 (GAD-7) */
  itemId: number;
  /** 0..3 */
  value: number;
}

export interface AnxietyAssessment {
  id: string;
  tenantId: string;
  createdByUserId: string | null;
  slug: string;
  colaboradorNome: string;
  cargo: string;
  setor: string;
  dataAplicacao: string;
  baiRespostas: AnxietyAnswer[] | null;
  baiEscore: number | null;
  baiClassificacao: AnxietyClassification | null;
  baiRespondidoEm: string | null;
  gad7Respostas: AnxietyAnswer[] | null;
  gad7Escore: number | null;
  gad7Classificacao: AnxietyClassification | null;
  gad7RespondidoEm: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Projeção pública (link do colaborador) — sem escores nem respostas. */
export interface AnxietyAssessmentPublicView {
  slug: string;
  colaboradorNome: string;
  cargo: string;
  setor: string;
  dataAplicacao: string;
  active: boolean;
  baiPendente: boolean;
  gad7Pendente: boolean;
}

export interface CreateAnxietyAssessmentDto {
  colaboradorNome: string;
  cargo?: string;
  setor?: string;
  dataAplicacao: string;
}

export interface SubmitAnxietyAnswersDto {
  instrument: AnxietyInstrument;
  answers: AnxietyAnswer[];
}

// ─── PDI — Plano de Desenvolvimento Individual ──────────────────────────────────

/**
 * pendente               — criado; aguardando o gestor preencher as ações
 * aguardando_colaborador — gestor preencheu; aguardando a validação do colaborador
 * concluida              — colaborador validou; PDF disponível
 */
export type PdiStatus = 'pendente' | 'aguardando_colaborador' | 'concluida';

export type PdiResponsabilidade = 'colaborador' | 'empresa';

export interface PdiAction {
  /** Ação a ser realizada (curso, formação, palestra, livro, filme, reunião de acompanhamento) */
  acao: string;
  responsabilidade: PdiResponsabilidade;
  /** id da competência vinculada (ver competencies.ts) */
  competenciaId: string;
  /** ISO date string: "2026-08-30" */
  prazo: string;
}

export interface Pdi {
  id: string;
  tenantId: string;
  createdByUserId: string | null;
  slug: string;
  evaluationId: string;
  evaluationSlug: string;
  colaboradorNome: string;
  setor: string;
  cargo: string;
  gestorArea: string;
  projeto: string;
  avaliador: string;
  dataAvaliacao: string;
  status: PdiStatus;
  actions: PdiAction[] | null;
  managerFeedback: string | null;
  managerSubmittedAt: string | null;
  colaboradorNomeValidacao: string | null;
  colaboradorComentario: string | null;
  colaboradorSubmittedAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreatePdiDto {
  evaluationSlug: string;
}

export interface SubmitPdiManagerDto {
  actions: PdiAction[];
  managerFeedback?: string;
}

export interface SubmitPdiColaboradorDto {
  colaboradorNome: string;
  comentario?: string;
}

// ─── Pesquisas Corporativas ────────────────────────────────────────────────────

export type PesquisaEscala = 'likert5' | 'likert3' | 'nps' | 'aberta' | 'opcoes' | 'multipla' | 'booleano';

export interface PesquisaPergunta {
  id: string;
  texto: string;
  escala: PesquisaEscala;
  opcoes?: string[];
  obrigatoria: boolean;
  ordem: number;
}

export interface PesquisaBloco {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  perguntas: PesquisaPergunta[];
}

export type PesquisaVisibility = 'global' | 'especifica' | 'privada';

export interface PesquisaCorporativa {
  id: string;
  tenantId: string | null;
  titulo: string;
  slug: string;
  tipo: string;
  blocos: PesquisaBloco[];
  ativa: boolean;
  periodo: string | null;
  categoria: string | null;
  visibility: PesquisaVisibility;
  allowedTenantIds: string[] | null;
  criadoEm: string;
}

export interface PesquisaAnswer {
  perguntaId: string;
  valor: number | string | boolean | string[];
}

export interface CreatePesquisaRespostaDto {
  nomeRespondente?: string;
  metadados?: Record<string, unknown>;
  answers: PesquisaAnswer[];
}

export interface PesquisaResposta {
  id: string;
  tenantId: string;
  pesquisaId: string;
  nomeRespondente: string;
  metadados: Record<string, unknown>;
  answers: PesquisaAnswer[];
  criadoEm: string;
}

export interface PesquisaMetricas {
  total: number;
  mediaGeral: number | null;
  porPergunta: Record<string, { media: number; total: number }>;
}

// ─── Protocolos (Protocolo de Dor Torácica — FORMMED027) ────────────────────────

/**
 * Etapa corrente. As etapas concretas dependem do tipo de protocolo (ver registry):
 *   Dor Torácica: triagem → ecg → investigacao → desfecho → concluido
 *   Sepse:        abertura → pacote1h → reavaliacao → desfecho → concluido
 */
export type ProtocoloStage = string;

export interface ResponsavelBloco {
  responsavelNome: string;
  registroProfissional: string;
  fechadoEm: string;
}

export interface BlocoTriagem extends ResponsavelBloco {
  inicioTriagem: string;
  classificacaoManchester: 'vermelho' | 'laranja' | '';
  sinaisVitais: {
    paMsd: string; paMse: string; fc: string; fr: string; spo2: string; tax: string; glicemia: string;
  };
  queixaPrincipal: {
    dorToracica: boolean; dispneiaSubita: boolean; sudoreseNauseaSincope: boolean; dorIrradiada: boolean;
  };
  inicioSintomasData: string;
  inicioSintomasHora: string;
  alergias: boolean;
  alergiasDescricao: string;
  instabilidade: boolean;
}

// ETAPA 2 — ECG (realizada em horário separado da triagem)
export interface BlocoEcg extends ResponsavelBloco {
  primeiroEcgHora: string;
  interpretacaoMedicaHora: string;
  resultadoEcg: 'via_i' | 'via_ii' | 'via_iii' | '';
  derivacoesExtras: { v3rV4r: boolean; v7v9: boolean; ecgSeriado: boolean };
}

export type ModoColeta = 'quantitativo' | 'qualitativo';

export interface ColetaTroponina {
  horaColeta: string;
  /** 'quantitativo' = valor em ng/mL (resultado); 'qualitativo' = Positivo/Negativo (resultadoQualitativo). */
  modo: ModoColeta;
  resultado: string; // ng/mL (modo quantitativo)
  resultadoQualitativo: 'negativo' | 'positivo' | ''; // modo qualitativo
  horaResultadoLab: string;
}

export interface BlocoInvestigacao extends ResponsavelBloco {
  lsnUnidade: string;
  coleta0h: ColetaTroponina;
  coleta3h: ColetaTroponina;
  coleta3hDeltaPct: string;
  coleta6h: ColetaTroponina;
  troponinaInterpretacao: 'rule_in' | 'rule_out' | 'inconclusivo' | '';
  heartH: number; heartE: number; heartA: number; heartR: number; heartT: number;
  heartTotal: number;
  heartFaixaRisco: 'baixo' | 'intermediario' | 'alto' | '';
  condutaHeart: 'alta_segura' | 'observacao' | 'internacao' | '';
  diagnosticos: {
    naoSeAplica: boolean;
    dissecaoAorta: boolean; dissecaoAortaAddRs: string;
    tep: boolean; tepWells: string;
    pericardite: boolean; takotsubo: boolean; pneumotorax: boolean; tamponamento: boolean;
  };
}

export type DestinoPaciente =
  | 'alta_ambulatorial' | 'observacao' | 'internacao_uti'
  | 'transferencia_icp' | 'transferencia_uti_referencia' | 'obito' | '';

export interface BlocoDesfecho extends ResponsavelBloco {
  trombolitiseElegivel: boolean;
  trombolitiseMotivoNao: string;
  inicioFibrinolitico: string;
  tempoPortaAgulhaMin: string;
  criteriosReperfusao: { resolucaoSt50: boolean; eva3: boolean; arritmiaReperfusao: boolean };
  eficaciaTrombolise: 'sucesso' | 'falha' | '';
  medidasAdmissao: { aas: boolean; p2y12: boolean; anticoagulante: boolean; monitorizacao: boolean; o2: boolean };
  prescricoesAlta: { aas: boolean; p2y12: boolean; estatina: boolean; betabloqueador: boolean; iecaBra: boolean };
  destino: DestinoPaciente;
  obitoData: string;
  obitoHora: string;
  solicitacaoRegulacaoHora: string;
  confirmacaoVagaHora: string;
  saidaEfetivaHora: string;
  altaSeguraCriterios: {
    heart3TropNeg: boolean; ecgSemIsquemia: boolean; semInstabilidade: boolean;
    daaTepAfastados: boolean; seguimentoAgendado: boolean; orientacoesEntregues: boolean;
  };
  enfermeiroNomeCoren: string;
  medicoNomeCrm: string;
}

export type MotivoEncerramento = 'nao_continuidade' | 'nao_indicacao' | '';

export interface EncerramentoProtocolo {
  motivo: MotivoEncerramento;
  observacao: string;
  etapaNoEncerramento: ProtocoloStage;
  encerradoPorNome: string;
  encerradoPorRegistro: string;
  encerradoPorUserId: string | null;
  encerradoEm: string;
}

export interface AlteracaoCampo {
  bloco: string;
  campo: string;
  de: string;
  para: string;
  porUserId: string | null;
  porNome: string;
  em: string;
}

export interface RegistroAcao {
  tipo: 'fechamento' | 'edicao';
  bloco: string;
  porNome: string;
  porRegistro: string;
  porUserId: string | null;
  em: string;
  campos: { campo: string; de: string; para: string }[];
}

export interface Protocolo {
  id: string;
  tenantId: string;
  protocolType: string;
  slug: string;
  createdByUserId: string | null;
  pacienteNome: string;
  numeroProntuario: string;
  dataNascimento: string;
  idade: string;
  sexo: string;
  /** Sepse pediátrica: peso (kg) para cálculo de doses. */
  pesoKg: string;
  /** Sepse: variante resolvida pela idade ('adulto' | 'pediatrico'). Vazio nos demais. */
  variante: string;
  dataAtendimento: string;
  horaChegada: string;
  currentStage: ProtocoloStage;
  /** Mapa genérico de blocos por etapa — fonte de verdade para todos os tipos. */
  blocos: Record<string, unknown>;
  /** Mapa genérico de rascunhos (stand-by) por etapa. */
  rascunhos: Record<string, unknown>;
  // Colunas legado de Dor Torácica (preservadas; o código novo lê de `blocos`/`rascunhos`).
  triagem?: BlocoTriagem | null;
  ecg?: BlocoEcg | null;
  investigacao?: BlocoInvestigacao | null;
  desfecho?: BlocoDesfecho | null;
  triagemRascunho?: Partial<BlocoTriagem> | null;
  ecgRascunho?: Partial<BlocoEcg> | null;
  investigacaoRascunho?: Partial<BlocoInvestigacao> | null;
  desfechoRascunho?: Partial<BlocoDesfecho> | null;
  encerramento: EncerramentoProtocolo | null;
  historicoAlteracoes: AlteracaoCampo[];
  historicoAcoes: RegistroAcao[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProtocoloDto {
  protocolType?: string;
  pacienteNome: string;
  numeroProntuario?: string;
  dataNascimento?: string;
  idade?: string;
  sexo?: string;
  pesoKg?: string;
  variante?: string;
  dataAtendimento?: string;
  horaChegada?: string;
}

export interface ProtocoloIndicador {
  numerador: number;
  denominador: number;
  percentual: number;
  meta: number;
}

export interface ProtocoloMetrics {
  total: number;
  abertos: number;
  concluidos: number;
  porEtapa: Record<ProtocoloStage, number>;
  porVia: { via_i: number; via_ii: number; via_iii: number; naoInformado: number };
  porRiscoHeart: { baixo: number; intermediario: number; alto: number; naoInformado: number };
  indicadores: {
    portaTriagem5: ProtocoloIndicador;
    triagemEcg5: ProtocoloIndicador;
    ecgInterpretacao5: ProtocoloIndicador;
    portaEcg10: ProtocoloIndicador;
    portaAgulha30: ProtocoloIndicador;
    eficaciaTrombolise: ProtocoloIndicador;
    transferenciaMeta: ProtocoloIndicador;
    completude: ProtocoloIndicador;
  };
  tendenciaMensal: { mes: string; total: number }[];
}

export interface ProtocoloUser {
  id: string;
  email: string;
  username: string | null;
  nome: string;
  role: string;
  registroProfissional: string;
  tenantId: string | null;
  ativo: boolean;
  tenantSlug: string | null;
  tenantNome: string | null;
}

// ─── Protocolo de Sepse (FORM SEP — Adulto e Pediátrico) ────────────────────────
// Etapas: abertura → pacote1h → reavaliacao → desfecho → concluido.
// Mantido em sincronia manual com backend/src/modules/protocolos/protocolo-types.ts.

export type SepseVariante = 'adulto' | 'pediatrico' | '';

export interface SepseFocoPrincipal {
  pulmonar: boolean; urinario: boolean; abdominal: boolean; peleMoles: boolean;
  snc: boolean; cateter: boolean; endocardite: boolean; naoDefinido: boolean;
  outro: boolean; outroDesc: string;
}

export interface SepseBlocoAbertura extends ResponsavelBloco {
  horarioZeroData: string;
  horarioZeroHora: string;
  focoPrincipal: SepseFocoPrincipal;
  classificacao: string;
  criterioInfeccaoDisfuncao: boolean;
  criterioSirs2: boolean;
  disfuncoesOrganicas: {
    hemodinamico: boolean; renal: boolean; respiratorio: boolean; hematologico: boolean;
    metabolico: boolean; neurologico: boolean; hepatico: boolean; coagulopatia: boolean;
  };
  sirsPediatrica: { temperatura: boolean; taquicardia: boolean; taquipneia: boolean; leucocitose: boolean };
  sinaisHipoperfusao: {
    tecLento: boolean; perfusaoFlash: boolean; alteracaoMental: boolean; oliguria: boolean; hipotensao: boolean;
  };
}

export interface SepseColeta { feito: boolean; hora: string; valor: string }

export interface SepseBlocoPacote1h extends ResponsavelBloco {
  // Adulto
  lactato: SepseColeta;
  hemoculturas: { feito: boolean; hora: string };
  culturasFoco: { feito: boolean; hora: string; foco: string };
  antimicrobiano: { hora1aDose: string };
  reposicaoVolemica: { indicada: boolean; naoIndicada: boolean; hora: string; mlTotal: string };
  vasopressor: { indicado: boolean; naoIndicado: boolean; hora: string; via: string; dose: string };
  // Pediátrico — 5 passos
  passo1Acesso: { abcde: boolean; o2Ofertado: boolean; acessoVenoso: boolean; acessoIO: boolean; ioLocal: string };
  passo2Coletas: {
    lactato: SepseColeta;
    hemoculturas: { feito: boolean; hora: string };
    kitSepse: { feito: boolean; hora: string };
    glicemia: SepseColeta;
    calcioIonizado: SepseColeta;
  };
  passo3Atm: { doseCalculadaMg: string; hora1aDose: string; via: string; atmPrevio: boolean };
  passo4Volume: {
    bolus1: { ml: string; hora: string; tecPos: string; estertores: boolean };
    bolus2: { ml: string; hora: string; tecPos: string; estertores: boolean };
  };
  passo5Vasoativo: { tipoChoque: string; droga: string; doseInicial: string; hora: string; via: string };
}

export interface SepseMetaReav { valor: string; metaAtingida: string }

export interface SepseBlocoReavaliacao extends ResponsavelBloco {
  reav6h: {
    pam: SepseMetaReav; tec: SepseMetaReav; diurese: SepseMetaReav;
    spo2: SepseMetaReav; consciencia: SepseMetaReav; glicemia: SepseMetaReav;
  };
  phoenix: {
    respiratorio: number; cardiovascularVasoativo: number; cardiovascularLactato: number;
    coagulacao: number; neurologico: number; total: number; classificacao: string;
  };
  reav1a2h: {
    tec: SepseMetaReav; diurese: SepseMetaReav; pas: SepseMetaReav;
    consciencia: SepseMetaReav; spo2: SepseMetaReav;
  };
  recoletaLactato: { hora: string; valor: string; clareamento: string };
}

export interface SepseBlocoDesfecho extends ResponsavelBloco {
  criteriosTransferencia: {
    choqueVasopressor: boolean; lactatoSemClareamento: boolean; vniVm: boolean;
    duasDisfuncoes: boolean; deterioracao: boolean; alteracaoNeuro: boolean;
    glasgowBaixo: boolean; phoenix2: boolean;
  };
  utiAcionadaHora: string;
  vagaStatus: string;
  encerramentoTipo: string;
  dxAlternativoDesc: string;
  dataHoraEncerramentoData: string;
  dataHoraEncerramentoHora: string;
  desfecho: string;
}

export interface SepseMetrics {
  total: number;
  abertos: number;
  concluidos: number;
  porEtapa: Record<string, number>;
  porClassificacao: Record<string, number>;
  porFoco: Record<string, number>;
  porDesfecho: Record<string, number>;
  porFaixaPhoenix: { sepse: number; choque_septico: number; incompleto: number; naoInformado: number };
  indicadores: Record<string, ProtocoloIndicador>;
  tendenciaMensal: { mes: string; total: number }[];
}