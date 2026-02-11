import type { FormResponse, FormFilters, DashboardMetrics } from "../types";
import { api } from "./api";

function getAverageSatisfaction(form: FormResponse): number {
  const ratings = form.satisfaction;
  const values = Object.values(ratings) as number[];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function buildQueryString(filters?: FormFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.evaluatedDepartment) params.set("evaluatedDepartment", filters.evaluatedDepartment);
  if (filters.sortSatisfaction) params.set("sortSatisfaction", filters.sortSatisfaction);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const formService = {
  getAll: async (): Promise<FormResponse[]> => {
    return api.get<FormResponse[]>("forms");
  },

  getById: async (id: string): Promise<FormResponse> => {
    return api.get<FormResponse>(`forms/${id}`);
  },

  create: async (formData: Omit<FormResponse, "id" | "createdAt">): Promise<FormResponse> => {
    return api.post<FormResponse>("forms", formData);
  },

  filter: async (filters: FormFilters): Promise<FormResponse[]> => {
    const qs = buildQueryString(filters);
    return api.get<FormResponse[]>(`forms${qs}`);
  },

  getAverageSatisfaction,

  getMetrics: async (filters?: FormFilters): Promise<DashboardMetrics> => {
    const qs = buildQueryString(filters);
    return api.get<DashboardMetrics>(`forms/metrics${qs}`);
  },
};
