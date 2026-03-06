import type { Form3Response, Form3Type } from "../types";
import { FORM3_CONFIGS, FORM3_DEPARTMENT_OPTIONS } from "../pages/survey-form3-config";
import { getScaleAverage } from "./form3-service";

export function getAverageByFormType(forms: Form3Response[]) {
  return FORM3_DEPARTMENT_OPTIONS.map((dept) => {
    const deptForms = forms.filter((f) => f.formType === dept);
    const avg =
      deptForms.length > 0
        ? deptForms.reduce((sum, f) => sum + getScaleAverage(f), 0) / deptForms.length
        : 0;
    return {
      formType: dept,
      value: Number(avg.toFixed(1)),
      count: deptForms.length,
    };
  }).filter((d) => d.count > 0);
}

export function getAverageByQuestion(forms: Form3Response[], formType: Form3Type) {
  const deptForms = forms.filter((f) => f.formType === formType);
  if (deptForms.length === 0) return [];

  const config = FORM3_CONFIGS[formType];
  return config.blocks.flatMap((block) =>
    block.questions
      .filter((q) => q.scale === "rating4")
      .map((q) => {
        const values = deptForms
          .map((f) => f.answers.find((a) => a.questionId === q.id)?.value)
          .filter((v): v is number => v !== undefined && v > 0);
        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        return {
          question: q.text.length > 60 ? q.text.slice(0, 57) + "..." : q.text,
          value: Number(avg.toFixed(1)),
        };
      })
  );
}

export function getNpsBreakdown(forms: Form3Response[]) {
  return FORM3_DEPARTMENT_OPTIONS.map((dept) => {
    const deptForms = forms.filter((f) => f.formType === dept);
    const npsValues = deptForms
      .map((f) => f.answers.find((a) => a.questionId === 'nps')?.value)
      .filter((v): v is number => v !== undefined);

    const promotores = npsValues.filter((v) => v >= 9).length;
    const neutros = npsValues.filter((v) => v >= 7 && v <= 8).length;
    const detratores = npsValues.filter((v) => v <= 6).length;

    return { formType: dept, Promotores: promotores, Neutros: neutros, Detratores: detratores };
  }).filter((d) => d.Promotores + d.Neutros + d.Detratores > 0);
}

export function getMonthlyTrend(forms: Form3Response[]) {
  const monthMap = new Map<string, number>();

  forms.forEach((form) => {
    const date = new Date(form.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ mes: month, respostas: count }));
}

export function getNpsCrossForm(forms: Form3Response[]) {
  return FORM3_DEPARTMENT_OPTIONS.map((dept) => {
    const deptForms = forms.filter((f) => f.formType === dept);
    const npsValues = deptForms
      .map((f) => f.answers.find((a) => a.questionId === 'nps')?.value)
      .filter((v): v is number => v !== undefined);
    const avgNps = npsValues.length > 0
      ? Number((npsValues.reduce((s, v) => s + v, 0) / npsValues.length).toFixed(1))
      : 0;
    return { formType: dept, avgNps, count: npsValues.length };
  }).filter((d) => d.count > 0);
}

export function getSummaryMetrics(forms: Form3Response[]) {
  const avgSatisfaction =
    forms.length > 0
      ? forms.reduce((sum, f) => sum + getScaleAverage(f), 0) / forms.length
      : 0;

  const npsValues = forms
    .map((f) => f.answers.find((a) => a.questionId === 'nps')?.value)
    .filter((v): v is number => v !== undefined);

  const avgNps =
    npsValues.length > 0
      ? Number((npsValues.reduce((s, v) => s + v, 0) / npsValues.length).toFixed(1))
      : 0;

  const promotores = npsValues.filter((v) => v >= 9).length;
  const detratores = npsValues.filter((v) => v <= 6).length;
  const npsScore =
    npsValues.length > 0
      ? Number((((promotores - detratores) / npsValues.length) * 100).toFixed(1))
      : 0;

  return {
    total: forms.length,
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    avgNps,
    npsScore,
  };
}
