export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
}

export interface SatisfactionRatings {
  overallCare: number;
  nursingCare: number;
  medicalCare: number;
  welcoming: number;
  cleanliness: number;
  comfort: number;
  responseTime: number;
  overallSatisfaction: number;
}

export interface ExperienceAnswers {
  professionalsIdentified: boolean;
  nameVerified: boolean;
  treatmentExplained: boolean;
  participatedInDecisions: boolean;
  medicationInstructionsClear: boolean;
  dischargeOrientationComplete: boolean;
  knewWhoToAsk: boolean;
  privacyRespected: boolean;
  wouldRecommend: boolean;
}

export interface FormResponse {
  id: string;
  patientName: string;
  patientCpf: string;
  patientAge: number;
  patientGender: 'Masculino' | 'Feminino' | 'Outro';
  admissionDate: string;
  dischargeDate: string;
  evaluatedDepartment: string;
  satisfaction: SatisfactionRatings;
  experience: ExperienceAnswers;
  comments: string;
  createdAt: string;
}

export interface FormFilters {
  startDate?: string;
  endDate?: string;
  sortSatisfaction?: 'asc' | 'desc';
  evaluatedDepartment?: string;
}

export interface DashboardMetrics {
  totalResponses: number;
  averageSatisfaction: number;
  recommendationRate: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
}

// ─── Form 2: Hospital Infrastructure & Care ───────────────────────────────────

export interface InfrastructureRatings {
  // 🏥 Infraestrutura
  hospitalOverallInfrastructure: number;
  commonAreasAdequacy: number;
  // 🩺 Equipamentos
  equipmentSafety: number;
  equipmentCondition: number;
  // 🛏️ Acomodação
  bedComfort: number;
  accommodationNeeds: number;
  // 🍽️ Nutrição
  mealQuality: number;
  mealTimeliness: number;
  nutritionTeamCare: number;
  // 🧭 Comunicação e Sinalização
  hospitalSignage: number;
  teamCommunicationClarity: number;
  // 👨‍⚕️ Equipe Médica
  medicalTeamRelationship: number;
  diagnosisExplanation: number;
  feltHeardByMedicalTeam: number;
  // 👩‍⚕️ Equipe Assistencial
  nursingTeamCare: number;
  nursingTeamAvailability: number;
  feltSafeWithCare: number;
  // 💻 Tecnologia
  technologyAccess: number;
  connectivitySatisfaction: number;
  // 👕 Lavanderia
  laundryCleanlinessOrganization: number;
  laundryChangeFrequency: number;
}

export interface PatientSafetyAnswers {
  // 🆔 Identificação do Paciente (Sim / Não / Parcialmente)
  usedIdentificationBracelet: 'Sim' | 'Não' | 'Parcialmente';
  braceletInfoCorrect: 'Sim' | 'Não' | 'Parcialmente';
  bedIdentification: 'Sim' | 'Não' | 'Parcialmente';
  identityCheckedBeforeProcedures: 'Sim' | 'Não' | 'Parcialmente';
}

export interface Form2Response {
  id: string;
  patientName: string;
  patientCpf: string;
  patientAge: number;
  patientGender: 'Masculino' | 'Feminino' | 'Outro';
  admissionDate: string;
  dischargeDate: string;
  infrastructure: InfrastructureRatings;
  patientSafety: PatientSafetyAnswers;
  comments: string;
  createdAt: string;
}

export interface Form2Filters {
  startDate?: string;
  endDate?: string;
  sortSatisfaction?: 'asc' | 'desc';
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
  formType: Form3Type;
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
  formType?: Form3Type;
  evaluatedDepartment?: string;
}

export interface Form3Metrics {
  totalResponses: number;
  averageSatisfaction: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
  averageNps: number;
  npsScore: number;
  // ...existing code...
}