import type {
  PesquisaCorporativa,
  PesquisaResposta,
  PesquisaMetricas,
  PesquisaBloco,
} from "@/types";
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

const LIKERT5_LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Insatisfeito",
  3: "Regular",
  4: "Satisfeito",
  5: "Muito satisfeito",
};

function buildPerguntaMap(blocos: PesquisaBloco[]): Map<string, { texto: string; escala: string }> {
  const map = new Map<string, { texto: string; escala: string }>();
  blocos.forEach((b) =>
    b.perguntas.forEach((p) => map.set(p.id, { texto: p.texto, escala: p.escala })),
  );
  return map;
}

function buildQuestionStats(
  blocos: PesquisaBloco[],
  metricas: PesquisaMetricas,
): QuestionStat[] {
  const map = buildPerguntaMap(blocos);
  return Object.entries(metricas.porPergunta)
    .map(([id, { media, total }]) => {
      const meta = map.get(id);
      if (!meta || meta.escala === "aberta") return null;
      return { text: sanitize(meta.texto), avg: media, count: total };
    })
    .filter((s): s is QuestionStat => s !== null);
}

function buildMetricCards(metricas: PesquisaMetricas): MetricCard[] {
  const cards: MetricCard[] = [
    { title: "Total de Respostas", value: String(metricas.total) },
  ];
  if (metricas.mediaGeral !== null) {
    cards.push({
      title: "Media Geral",
      value: `${metricas.mediaGeral.toFixed(1)}/5`,
      subtitle: "Escala 1-5",
    });
  }
  return cards;
}

function formatAnswerValue(
  valor: number | string | boolean | string[],
  escala: string,
): string {
  if (typeof valor === "number") {
    if (escala === "likert5") return sanitize(LIKERT5_LABELS[valor] ?? String(valor));
    return String(valor);
  }
  if (typeof valor === "boolean") return valor ? "Sim" : "Nao";
  if (Array.isArray(valor)) return sanitize(valor.join(", "));
  return sanitize(String(valor));
}

function drawResponses(
  doc: ReturnType<typeof createDoc>,
  respostas: PesquisaResposta[],
  blocos: PesquisaBloco[],
  y: number,
): number {
  const perguntaMap = buildPerguntaMap(blocos);

  y = drawSectionTitle(doc, `Respostas (${respostas.length})`, y);

  respostas.forEach((r, idx) => {
    const fornecedor = (r.metadados?.fornecedor as string | undefined)?.trim() || null;
    const tempo = r.metadados?.tempoDeEmpresa as string | undefined;
    const titulo = fornecedor || r.nomeRespondente || "Anonimo";

    const numericAnswers = r.answers.filter((a) => typeof a.valor === "number");
    const avg = numericAnswers.length > 0
      ? numericAnswers.reduce((s, a) => s + (a.valor as number), 0) / numericAnswers.length
      : null;

    const date = new Date(r.criadoEm).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    const blockHeight = 14 + r.answers.length * 6;
    y = checkPageBreak(doc, y, Math.min(blockHeight, 60));

    const fill = idx % 2 === 0 ? PDF_COLORS.rowAlt : PDF_COLORS.white;
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 9, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_COLORS.dark);
    doc.text(sanitize(titulo), PAGE_MARGIN + 2, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.gray);
    const headerParts: string[] = [date];
    if (avg !== null) headerParts.unshift(`Media ${avg.toFixed(1)}/5`);
    if (tempo) headerParts.unshift(sanitize(tempo));
    doc.text(headerParts.join("  |  "), PAGE_WIDTH - PAGE_MARGIN - 2, y + 6, { align: "right" });

    y += 11;

    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.dark);
    r.answers.forEach((a) => {
      const meta = perguntaMap.get(a.perguntaId);
      if (!meta) return;

      const questionText = sanitize(meta.texto);
      const valueText = formatAnswerValue(a.valor, meta.escala);

      if (meta.escala === "aberta") {
        const wrappedQ = doc.splitTextToSize(questionText, CONTENT_WIDTH - 8);
        const wrappedV = doc.splitTextToSize(valueText, CONTENT_WIDTH - 8);
        const needed = wrappedQ.length * 4 + wrappedV.length * 4 + 2;
        y = checkPageBreak(doc, y, needed);
        doc.setFont("helvetica", "bold");
        wrappedQ.forEach((line: string, li: number) => {
          doc.text(String(line), PAGE_MARGIN + 4, y + li * 4);
        });
        y += wrappedQ.length * 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_COLORS.dark);
        wrappedV.forEach((line: string, li: number) => {
          doc.text(String(line), PAGE_MARGIN + 6, y + li * 4);
        });
        y += wrappedV.length * 4 + 2;
      } else {
        y = checkPageBreak(doc, y, 5);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(questionText, CONTENT_WIDTH - 60);
        doc.text(String(wrapped[0] ?? ""), PAGE_MARGIN + 4, y);
        doc.setFont("helvetica", "bold");
        doc.text(valueText, PAGE_WIDTH - PAGE_MARGIN - 2, y, { align: "right" });
        y += 5;
      }
    });

    y += 3;
  });

  return y;
}

export function generatePesquisaCorporativaReport(
  pesquisa: PesquisaCorporativa,
  metricas: PesquisaMetricas,
  respostas: PesquisaResposta[],
): void {
  const doc = createDoc();

  const subtitles = [sanitize(`Tipo: ${pesquisa.tipo}`)];
  if (pesquisa.categoria) subtitles.push(sanitize(`Categoria: ${pesquisa.categoria}`));
  if (pesquisa.periodo) subtitles.push(sanitize(`Periodo: ${pesquisa.periodo}`));

  let y = drawHeader(doc, sanitize(`Relatorio - ${pesquisa.titulo}`), subtitles);

  y = drawMetricCards(doc, buildMetricCards(metricas), y);
  y = drawQuestionAnalytics(doc, buildQuestionStats(pesquisa.blocos, metricas), 5, y);

  if (respostas.length > 0) {
    drawResponses(doc, respostas, pesquisa.blocos, y);
  }

  drawFooter(doc);
  doc.save(`pesquisa-${pesquisa.slug}.pdf`);
}
