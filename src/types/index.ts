export type UserRole = 'holding_admin' | 'hospital_admin' | 'viewer' | 'operator_forms' | 'rh_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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