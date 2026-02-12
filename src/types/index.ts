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
  evaluatedDepartment?: string;
  sortSatisfaction?: 'asc' | 'desc';
}

export interface DashboardMetrics {
  totalResponses: number;
  averageSatisfaction: number;
  recommendationRate: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
}