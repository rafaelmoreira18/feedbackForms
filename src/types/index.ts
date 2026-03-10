export type UserRole = 'holding_admin' | 'hospital_admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
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
  patientCpf: string;
  patientAge: number;
  patientGender: 'Masculino' | 'Feminino' | 'Outro';
  admissionDate: string;
  dischargeDate: string;
  evaluatedDepartment: string;
  answers: Form3Answer[];
  comments: string;
  createdAt: string;
}

export interface Form3Filters {
  startDate?: string;
  endDate?: string;
  sortSatisfaction?: 'asc' | 'desc';
  formType?: string;
  evaluatedDepartment?: string;
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