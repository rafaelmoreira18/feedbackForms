import type { FormResponse, FormFilters, DashboardMetrics } from "../types";

const STORAGE_KEY = "hospital_forms";

function getAverageSatisfaction(form: FormResponse): number {
  const ratings = form.satisfaction;
  const values = Object.values(ratings) as number[];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export const formService = {
  getAll: (): FormResponse[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const forms: FormResponse[] = JSON.parse(stored);
    return forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      forms = forms.filter((form) => form.createdAt <= filters.endDate! + "T23:59:59");
    }

    if (filters.department) {
      forms = forms.filter((form) => form.department === filters.department);
    }

    if (filters.sortSatisfaction) {
      forms = [...forms].sort((a, b) =>
        filters.sortSatisfaction === "desc"
          ? getAverageSatisfaction(b) - getAverageSatisfaction(a)
          : getAverageSatisfaction(a) - getAverageSatisfaction(b)
      );
    } else {
      forms = [...forms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return forms;
  },

  getAverageSatisfaction,

  getMetrics: (formsInput?: FormResponse[]): DashboardMetrics => {
    const forms = formsInput ?? formService.getAll();
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
        ? forms.reduce((sum, form) => sum + getAverageSatisfaction(form), 0) /
          forms.length
        : 0;

    const recommendCount = forms.filter(
      (form) => form.satisfaction.wouldRecommend >= 4
    ).length;
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