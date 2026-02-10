export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
}

export interface FormResponse {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Masculino' | 'Feminino' | 'Outro';
  admissionDate: string;
  dischargeDate: string;
  department: string;
  overallSatisfaction: number;
  medicalCareQuality: number;
  nursingCareQuality: number;
  facilitiesQuality: number;
  waitingTime: number;
  communicationQuality: number;
  wouldRecommend: boolean;
  comments: string;
  createdAt: string;
}

export interface FormFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  minSatisfaction?: number;
  maxSatisfaction?: number;
}

export interface DashboardMetrics {
  totalResponses: number;
  averageSatisfaction: number;
  recommendationRate: number;
  responsesThisMonth: number;
  responsesLastMonth: number;
}
