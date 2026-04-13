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