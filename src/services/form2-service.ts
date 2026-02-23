import type { Form2Response, Form2Filters } from "../types";
import { api } from "./api";

function getAverageInfrastructure(form: Form2Response): number {
  const values = Object.values(form.infrastructure) as number[];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function buildQueryString(filters?: Form2Filters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.sortSatisfaction) params.set("sortSatisfaction", filters.sortSatisfaction);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const form2Service = {
  getAll: async (): Promise<Form2Response[]> => {
    return api.get<Form2Response[]>("forms2");
  },

  getById: async (id: string): Promise<Form2Response> => {
    return api.get<Form2Response>(`forms2/${id}`);
  },

  create: async (formData: Omit<Form2Response, "id" | "createdAt">): Promise<Form2Response> => {
    return api.post<Form2Response>("forms2", formData);
  },

  filter: async (filters: Form2Filters): Promise<Form2Response[]> => {
    const qs = buildQueryString(filters);
    return api.get<Form2Response[]>(`forms2${qs}`);
  },

  getAverageInfrastructure,

  getMetrics: async (filters?: Form2Filters) => {
    const qs = buildQueryString(filters);
    return api.get<{
      totalResponses: number;
      averageSatisfaction: number;
      responsesThisMonth: number;
      responsesLastMonth: number;
    }>(`forms2/metrics${qs}`);
  },
};
