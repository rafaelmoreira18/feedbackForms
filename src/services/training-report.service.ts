import type { TrainingSession, TrainingType } from "@/types";
import {
  EFICACIA_QUESTIONS,
  REACAO_QUESTIONS,
  TRAINING_TYPE_LABELS,
} from "@/pages/rh/treinamentos/session-constants";
import type { TrainingResponse, TrainingMetrics } from "./training-service";
import {
  createDoc,
  drawFooter,
  drawHeader,
  drawMetricCards,
  drawQuestionAnalytics,
  sanitize,
  type MetricCard,
  type QuestionStat,
} from "./pdf/pdf-helpers";

function questionsFor(type: TrainingType): string[] {
  return type === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
}

function buildQuestionStats(responses: TrainingResponse[], type: TrainingType): QuestionStat[] {
  const questions = questionsFor(type);
  return questions
    .map((text, i) => {
      const qid = `q${i + 1}`;
      const values = responses
        .map((r) => r.answers.find((a) => a.questionId === qid)?.value)
        .filter((v): v is number => v != null && v > 0);
      const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      return { text: sanitize(text), avg, count: values.length };
    })
    .filter((q) => q.count > 0);
}

function buildMetricCards(
  session: TrainingSession,
  metrics: TrainingMetrics,
  scaleMax: number,
): MetricCard[] {
  const cards: MetricCard[] = [
    { title: "Total de Respostas", value: String(metrics.totalResponses) },
    {
      title: "Media Satisfacao",
      value: `${metrics.averageSatisfaction.toFixed(1)}/${scaleMax}`,
      subtitle: "Escala do formulario",
    },
  ];
  if (session.trainingType === "reacao") {
    cards.push({
      title: "Recomendariam",
      value: `${metrics.averageNps}%`,
      subtitle: "Avaliacoes de Reacao",
    });
  }
  cards.push({
    title: "Respostas Este Mes",
    value: String(metrics.responsesThisMonth),
    subtitle: `${metrics.responsesLastMonth} no mes anterior`,
  });
  return cards;
}

export function generateTrainingReport(
  session: TrainingSession,
  metrics: TrainingMetrics,
  responses: TrainingResponse[],
): void {
  const doc = createDoc();
  const scaleMax = session.trainingType === "eficacia" ? 3 : 5;

  let y = drawHeader(
    doc,
    sanitize(`Relatorio - ${session.title}`),
    [
      sanitize(`Tipo: ${TRAINING_TYPE_LABELS[session.trainingType]}`),
      sanitize(`Data do treinamento: ${session.trainingDate}`),
      sanitize(`Facilitador: ${session.instructor}`),
    ],
  );

  y = drawMetricCards(doc, buildMetricCards(session, metrics, scaleMax), y);
  drawQuestionAnalytics(doc, buildQuestionStats(responses, session.trainingType), scaleMax, y);

  drawFooter(doc);
  doc.save(`treinamento-${session.slug}.pdf`);
}
