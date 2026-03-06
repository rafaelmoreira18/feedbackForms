import type { FormResponse, FormFilters, DashboardMetrics } from "./index";

export interface ReportData {
  metrics: DashboardMetrics;
  filters: FormFilters;
  responses: FormResponse[];
  generatedAt: string;
  totalFormsCount: number;
}
