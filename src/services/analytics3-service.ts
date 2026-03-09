import type { Form3Response } from "../types";
import { getScaleAverage } from "./form3-service";

/**
 * All analytics functions derive department lists from the actual response data.
 * No hardcoded department lists or form configs — fully data-driven.
 */

export function getAverageByFormType(forms: Form3Response[]) {
  const deptMap = new Map<string, number[]>();
  forms.forEach((f) => {
    const scaleAnswers = f.answers.filter((a) => a.questionId !== "nps" && a.value > 0);
    if (scaleAnswers.length === 0) return;
    const avg = scaleAnswers.reduce((s, a) => s + a.value, 0) / scaleAnswers.length;
    if (!deptMap.has(f.formType)) deptMap.set(f.formType, []);
    deptMap.get(f.formType)!.push(avg);
  });

  return Array.from(deptMap.entries()).map(([formType, avgs]) => ({
    formType,
    value: Number((avgs.reduce((s, v) => s + v, 0) / avgs.length).toFixed(1)),
    count: avgs.length,
  }));
}

export interface QuestionAvg {
  questionId: string;
  question: string;
  questionShort: string;
  value: number;
  count: number;
  subReasons?: string[] | null;
}

export function getAverageByQuestion(
  forms: Form3Response[],
  formType: string,
  questionTextMap?: Map<string, Map<string, string>>,
): QuestionAvg[] {
  const deptForms = forms.filter((f) => f.formType === formType);
  if (deptForms.length === 0) return [];

  const qTexts = questionTextMap?.get(formType);

  const questionIds = Array.from(
    new Set(
      deptForms.flatMap((f) =>
        f.answers.filter((a) => a.questionId !== "nps" && a.value > 0).map((a) => a.questionId)
      )
    )
  );

  return questionIds.map((qId) => {
    const values = deptForms
      .map((f) => f.answers.find((a) => a.questionId === qId)?.value)
      .filter((v): v is number => v !== undefined && v > 0);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    const fullText = qTexts?.get(qId) ?? qId;
    return {
      questionId: qId,
      question: fullText,
      questionShort: fullText,
      value: Number(avg.toFixed(1)),
      count: values.length,
    };
  }).filter((q) => q.count > 0);
}

export interface QuestionDetail {
  questionId: string;
  questionText: string;
  formType: string;
  avg: number;
  total: number;
  negativeCount: number;
  distribution: { label: string; count: number; pct: number }[];
  subReasons: { text: string; count: number; pct: number }[];
  notes: string[];
}

export function getQuestionDetail(
  forms: Form3Response[],
  formType: string,
  questionId: string,
  questionTextMap?: Map<string, Map<string, string>>,
): QuestionDetail | null {
  const deptForms = forms.filter((f) => f.formType === formType);
  if (deptForms.length === 0) return null;

  const LABELS = ["", "Ruim", "Regular", "Bom", "Excelente"];
  const ratingCounts = [0, 0, 0, 0, 0];
  const values: number[] = [];
  const notes: string[] = [];
  const reasonCountMap = new Map<string, number>();
  let negativeCount = 0;

  deptForms.forEach((f) => {
    const ans = f.answers.find((a) => a.questionId === questionId);
    if (!ans || ans.value < 1 || ans.value > 4) return;
    ratingCounts[ans.value]++;
    values.push(ans.value);
    if (ans.value <= 2) {
      negativeCount++;
      ans.reasons?.forEach((r) => reasonCountMap.set(r, (reasonCountMap.get(r) ?? 0) + 1));
      if (ans.note?.trim()) notes.push(ans.note.trim());
    }
  });

  const total = values.length;
  if (total === 0) return null;

  const avg = Number((values.reduce((s, v) => s + v, 0) / total).toFixed(2));
  const distribution = [1, 2, 3, 4].map((r) => ({
    label: LABELS[r],
    count: ratingCounts[r],
    pct: Math.round((ratingCounts[r] / total) * 100),
  }));

  const subReasons = Array.from(reasonCountMap.entries()).map(([text, count]) => ({
    text,
    count,
    pct: negativeCount > 0 ? Math.round((count / negativeCount) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const fullText = questionTextMap?.get(formType)?.get(questionId) ?? questionId;

  return {
    questionId,
    questionText: fullText,
    formType,
    avg,
    total,
    negativeCount,
    distribution,
    subReasons,
    notes,
  };
}

export function getNpsBreakdown(forms: Form3Response[]) {
  const deptMap = new Map<string, { p: number; n: number; d: number }>();
  forms.forEach((f) => {
    const nps = f.answers.find((a) => a.questionId === "nps")?.value;
    if (nps === undefined) return;
    if (!deptMap.has(f.formType)) deptMap.set(f.formType, { p: 0, n: 0, d: 0 });
    const entry = deptMap.get(f.formType)!;
    if (nps >= 9) entry.p++;
    else if (nps >= 7) entry.n++;
    else entry.d++;
  });

  return Array.from(deptMap.entries())
    .map(([formType, { p, n, d }]) => ({
      formType,
      Promotores: p,
      Neutros: n,
      Detratores: d,
    }))
    .filter((d) => d.Promotores + d.Neutros + d.Detratores > 0);
}

export function getMonthlyTrend(forms: Form3Response[]) {
  const monthMap = new Map<string, number>();
  forms.forEach((f) => {
    const date = new Date(f.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ mes: month, respostas: count }));
}

export function getNpsCrossForm(forms: Form3Response[]) {
  const deptMap = new Map<string, number[]>();
  forms.forEach((f) => {
    const nps = f.answers.find((a) => a.questionId === "nps")?.value;
    if (nps === undefined) return;
    if (!deptMap.has(f.formType)) deptMap.set(f.formType, []);
    deptMap.get(f.formType)!.push(nps);
  });

  return Array.from(deptMap.entries())
    .map(([formType, values]) => ({
      formType,
      avgNps: Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)),
      count: values.length,
    }))
    .filter((d) => d.count > 0);
}

export function getSummaryMetrics(forms: Form3Response[]) {
  const avgSatisfaction =
    forms.length > 0
      ? forms.reduce((sum, f) => sum + getScaleAverage(f), 0) / forms.length
      : 0;

  const npsValues = forms
    .map((f) => f.answers.find((a) => a.questionId === "nps")?.value)
    .filter((v): v is number => v !== undefined);

  const avgNps =
    npsValues.length > 0
      ? Number((npsValues.reduce((s, v) => s + v, 0) / npsValues.length).toFixed(1))
      : 0;

  return {
    total: forms.length,
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    avgNps,
  };
}
