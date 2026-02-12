import type { FormResponse, SatisfactionRatings } from "../types";
import { formService } from "./form-service";

const satisfactionKeys: { key: keyof SatisfactionRatings; label: string }[] = [
  { key: "overallCare", label: "Atendimento Geral" },
  { key: "nursingCare", label: "Enfermagem" },
  { key: "medicalCare", label: "Equipe Médica" },
  { key: "welcoming", label: "Acolhimento" },
  { key: "cleanliness", label: "Limpeza" },
  { key: "comfort", label: "Conforto" },
  { key: "responseTime", label: "Tempo de Resposta" },
  { key: "overallSatisfaction", label: "Satisfação Geral" },
];

export function getDepartmentData(forms: FormResponse[]) {
  const map = new Map<string, { count: number; totalSatisfaction: number }>();

  forms.forEach((form) => {
    const avg = formService.getAverageSatisfaction(form);
    const current = map.get(form.evaluatedDepartment) || { count: 0, totalSatisfaction: 0 };
    map.set(form.evaluatedDepartment, {
      count: current.count + 1,
      totalSatisfaction: current.totalSatisfaction + avg,
    });
  });

  return Array.from(map.entries()).map(([evaluatedDepartment, data]) => ({
    evaluatedDepartment,
    respostas: data.count,
    satisfacao: Number((data.totalSatisfaction / data.count).toFixed(1)),
  }));
}

export function getSatisfactionDistribution(forms: FormResponse[]) {
  const distribution = [
    { rating: "1 Estrela", count: 0 },
    { rating: "2 Estrelas", count: 0 },
    { rating: "3 Estrelas", count: 0 },
    { rating: "4 Estrelas", count: 0 },
    { rating: "5 Estrelas", count: 0 },
  ];

  forms.forEach((form) => {
    const avg = formService.getAverageSatisfaction(form);
    const index = Math.floor(avg) - 1;
    if (index >= 0 && index < 5) {
      distribution[index].count++;
    }
  });

  return distribution;
}

export function getRecommendationData(forms: FormResponse[]) {
  const wouldRecommend = forms.filter((f) => f.experience.wouldRecommend === true).length;
  const wouldNotRecommend = forms.length - wouldRecommend;

  return [
    { name: "Recomendariam", value: wouldRecommend },
    { name: "Não Recomendariam", value: wouldNotRecommend },
  ];
}

export function getAverageMetrics(forms: FormResponse[]) {
  if (forms.length === 0) return [];

  const count = forms.length;

  return satisfactionKeys.map(({ key, label }) => ({
    metric: label,
    value: Number(
      (forms.reduce((sum, form) => sum + form.satisfaction[key], 0) / count).toFixed(1)
    ),
  }));
}

export function getMonthlyTrend(forms: FormResponse[]) {
  const monthMap = new Map<string, number>();

  forms.forEach((form) => {
    const date = new Date(form.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({
      mes: month,
      respostas: count,
    }));
}

export function getSummaryMetrics(forms: FormResponse[]) {
  const avgSatisfaction =
    forms.length > 0
      ? forms.reduce((sum, f) => sum + formService.getAverageSatisfaction(f), 0) / forms.length
      : 0;

  const recommendRate =
    forms.length > 0
      ? (forms.filter((f) => f.experience.wouldRecommend === true).length / forms.length) * 100
      : 0;

  return {
    total: forms.length,
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    recommendRate: Number(recommendRate.toFixed(1)),
  };
}