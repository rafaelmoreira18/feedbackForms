import type { FormResponse, FormFilters, DashboardMetrics } from "../types";

// Simulação de banco de dados em localStorage
const STORAGE_KEY = "hospital_forms";

export const formService = {
  getAll: (): FormResponse[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getById: (id: string): FormResponse | undefined => {
    const forms = formService.getAll();
    return forms.find((form) => form.id === id);
  },

  create: (formData: Omit<FormResponse, "id" | "createdAt">): FormResponse => {
    const forms = formService.getAll();
    const newForm: FormResponse = {
      ...formData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    forms.push(newForm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
    return newForm;
  },

  filter: (filters: FormFilters): FormResponse[] => {
    let forms = formService.getAll();

    if (filters.startDate) {
      forms = forms.filter((form) => form.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      forms = forms.filter((form) => form.createdAt <= filters.endDate!);
    }

    if (filters.department) {
      forms = forms.filter((form) => form.department === filters.department);
    }

    if (filters.minSatisfaction !== undefined) {
      forms = forms.filter(
        (form) => form.overallSatisfaction >= filters.minSatisfaction!
      );
    }

    if (filters.maxSatisfaction !== undefined) {
      forms = forms.filter(
        (form) => form.overallSatisfaction <= filters.maxSatisfaction!
      );
    }

    return forms;
  },

  getMetrics: (): DashboardMetrics => {
    const forms = formService.getAll();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const responsesThisMonth = forms.filter(
      (form) => new Date(form.createdAt) >= thisMonthStart
    ).length;

    const responsesLastMonth = forms.filter(
      (form) =>
        new Date(form.createdAt) >= lastMonthStart &&
        new Date(form.createdAt) <= lastMonthEnd
    ).length;

    const avgSatisfaction =
      forms.length > 0
        ? forms.reduce((sum, form) => sum + form.overallSatisfaction, 0) /
          forms.length
        : 0;

    const recommendCount = forms.filter((form) => form.wouldRecommend).length;
    const recommendationRate =
      forms.length > 0 ? (recommendCount / forms.length) * 100 : 0;

    return {
      totalResponses: forms.length,
      averageSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      recommendationRate: Math.round(recommendationRate * 10) / 10,
      responsesThisMonth,
      responsesLastMonth,
    };
  },
};
