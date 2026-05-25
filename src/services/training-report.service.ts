import type { TrainingSession, TrainingType } from "@/types";
import {
  EFICACIA_QUESTIONS,
  REACAO_QUESTIONS,
  EFICACIA_LABELS,
  REACAO_LABELS,
  TRAINING_TYPE_LABELS,
} from "@/pages/rh/treinamentos/session-constants";
import type { TrainingResponse, TrainingMetrics } from "./training-service";
import {
  CONTENT_WIDTH,
  PAGE_MARGIN,
  PAGE_WIDTH,
  PDF_COLORS,
  checkPageBreak,
  createDoc,
  drawFooter,
  drawHeader,
  drawMetricCards,
  drawQuestionAnalytics,
  drawSectionTitle,
  sanitize,
  type MetricCard,
  type QuestionStat,
} from "./pdf/pdf-helpers";

function questionsFor(type: TrainingType): string[] {
  return type === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
}

function labelsFor(type: TrainingType): Record<number, string> {
  return type === "eficacia" ? EFICACIA_LABELS : REACAO_LABELS;
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

function avgOfResponse(response: TrainingResponse, questionCount: number): number {
  const scores = response.answers
    .filter((a) => a.questionId !== "nps" && a.value > 0)
    .slice(0, questionCount)
    .map((a) => a.value);
  if (scores.length === 0) return 0;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function drawResponses(
  doc: ReturnType<typeof createDoc>,
  responses: TrainingResponse[],
  type: TrainingType,
  y: number,
): number {
  const questions = questionsFor(type);
  const labels = labelsFor(type);
  const scaleMax = type === "eficacia" ? 3 : 5;

  y = drawSectionTitle(doc, `Respostas (${responses.length})`, y);

  responses.forEach((r, idx) => {
    const answerMap = new Map(r.answers.map((a) => [a.questionId, a.value]));
    const nps = answerMap.get("nps");
    const avg = avgOfResponse(r, questions.length);
    const date = new Date(r.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const blockHeight = 14 + questions.length * 5 + (type === "reacao" ? 5 : 0)
      + (r.pontoAlto ? 8 : 0) + (r.jaAplica ? 8 : 0)
      + (r.recomendaMotivo ? 8 : 0) + (r.comments ? 8 : 0);
    y = checkPageBreak(doc, y, blockHeight);

    const fill = idx % 2 === 0 ? PDF_COLORS.rowAlt : PDF_COLORS.white;
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 9, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_COLORS.dark);
    doc.text(sanitize(r.respondentName || "Anonimo"), PAGE_MARGIN + 2, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.gray);
    const headerParts: string[] = [date];
    if (avg > 0) headerParts.unshift(`Media ${avg.toFixed(1)}/${scaleMax}`);
    if (type === "reacao" && nps != null) headerParts.unshift(`Nota ${nps}/10`);
    if (type === "reacao" && r.recomenda != null) headerParts.unshift(r.recomenda ? "Recomenda" : "Nao recomenda");
    doc.text(headerParts.join("  |  "), PAGE_WIDTH - PAGE_MARGIN - 2, y + 6, { align: "right" });

    y += 11;

    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.dark);
    questions.forEach((q, i) => {
      const qid = `q${i + 1}`;
      const val = answerMap.get(qid);
      y = checkPageBreak(doc, y, 5);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(sanitize(`${i + 1}. ${q}`), CONTENT_WIDTH - 50);
      doc.text(String(wrapped[0] ?? ""), PAGE_MARGIN + 4, y);
      doc.setFont("helvetica", "bold");
      const valueText = val != null && val > 0 ? sanitize(labels[val] ?? String(val)) : "-";
      doc.text(valueText, PAGE_WIDTH - PAGE_MARGIN - 2, y, { align: "right" });
      y += 5;
    });

    if (type === "reacao" && nps != null) {
      y = checkPageBreak(doc, y, 5);
      doc.setFont("helvetica", "normal");
      doc.text("Nota geral (0-10)", PAGE_MARGIN + 4, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(nps), PAGE_WIDTH - PAGE_MARGIN - 2, y, { align: "right" });
      y += 5;
    }

    const textBlocks: { label: string; value: string }[] = [];
    if (r.pontoAlto) textBlocks.push({ label: "Ponto alto", value: r.pontoAlto });
    if (r.jaAplica) textBlocks.push({ label: "Ja aplica", value: r.jaAplica });
    if (r.recomendaMotivo) textBlocks.push({ label: "Motivo", value: r.recomendaMotivo });
    if (r.comments) textBlocks.push({ label: type === "eficacia" ? "Observacoes" : "Comentarios", value: r.comments });

    textBlocks.forEach((block) => {
      const wrapped = doc.splitTextToSize(sanitize(block.value), CONTENT_WIDTH - 8);
      const needed = 4 + wrapped.length * 4;
      y = checkPageBreak(doc, y, needed);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PDF_COLORS.gray);
      doc.text(`${block.label}:`, PAGE_MARGIN + 4, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...PDF_COLORS.dark);
      wrapped.forEach((line: string, li: number) => {
        doc.text(String(line), PAGE_MARGIN + 4, y + 4 + li * 4);
      });
      y += needed;
    });

    y += 3;
  });

  return y;
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
  y = drawQuestionAnalytics(doc, buildQuestionStats(responses, session.trainingType), scaleMax, y);

  if (responses.length > 0) {
    y = drawResponses(doc, responses, session.trainingType, y);
  }

  drawFooter(doc);
  doc.save(`treinamento-${session.slug}.pdf`);
}
