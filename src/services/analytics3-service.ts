import type { Form3Response } from "@/types";

export function getScaleAverage(form: Form3Response): number {
  if (form.recusouResponder) return 0;
  const scaleAnswers = form.answers.filter((a) => a.questionId !== "nps");
  if (scaleAnswers.length === 0) return 0;
  return scaleAnswers.reduce((sum, a) => sum + a.value, 0) / scaleAnswers.length;
}

export function getNpsScore(form: Form3Response): number | undefined {
  return form.answers.find((a) => a.questionId === "nps")?.value;
}

/**
 * All analytics functions derive department lists from the actual response data.
 * No hardcoded department lists or form configs — fully data-driven.
 */

export function getAverageByFormType(forms: Form3Response[]) {
  const deptMap = new Map<string, number[]>();
  forms.forEach((f) => {
    if (f.recusouResponder) return;
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
  const deptForms = forms.filter((f) => f.formType === formType && !f.recusouResponder);
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
  const deptForms = forms.filter((f) => f.formType === formType && !f.recusouResponder);
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

/** Returns { Sim, Não } counts per department. NPS: 1=Sim, 0=Não. */
export function getNpsBreakdown(forms: Form3Response[]) {
  const deptMap = new Map<string, { sim: number; nao: number }>();
  forms.forEach((f) => {
    if (f.recusouResponder) return;
    const nps = f.answers.find((a) => a.questionId === "nps")?.value;
    if (nps === undefined) return;
    if (!deptMap.has(f.formType)) deptMap.set(f.formType, { sim: 0, nao: 0 });
    const entry = deptMap.get(f.formType)!;
    if (nps === 1) entry.sim++;
    else entry.nao++;
  });

  return Array.from(deptMap.entries())
    .map(([formType, { sim, nao }]) => ({ formType, Sim: sim, Não: nao }))
    .filter((d) => d.Sim + d.Não > 0);
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

/** Returns % Sim por setor. NPS: 1=Sim, 0=Não. */
export function getNpsCrossForm(forms: Form3Response[]) {
  const deptMap = new Map<string, { sim: number; total: number }>();
  forms.forEach((f) => {
    if (f.recusouResponder) return;
    const nps = f.answers.find((a) => a.questionId === "nps")?.value;
    if (nps === undefined) return;
    if (!deptMap.has(f.formType)) deptMap.set(f.formType, { sim: 0, total: 0 });
    const entry = deptMap.get(f.formType)!;
    entry.total++;
    if (nps === 1) entry.sim++;
  });

  return Array.from(deptMap.entries())
    .map(([formType, { sim, total }]) => ({
      formType,
      pctSim: Number(((sim / total) * 100).toFixed(1)),
      count: total,
    }))
    .filter((d) => d.count > 0);
}

export function getSummaryMetrics(forms: Form3Response[]) {
  const answered = forms.filter((f) => !f.recusouResponder);

  const avgSatisfaction =
    answered.length > 0
      ? answered.reduce((sum, f) => sum + getScaleAverage(f), 0) / answered.length
      : 0;

  const npsAnswers = answered
    .map((f) => f.answers.find((a) => a.questionId === "nps")?.value)
    .filter((v): v is number => v !== undefined);

  const pctRecomendaria =
    npsAnswers.length > 0
      ? Number(((npsAnswers.filter((v) => v === 1).length / npsAnswers.length) * 100).toFixed(1))
      : 0;

  return {
    total: answered.length,
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    pctRecomendaria,
  };
}
