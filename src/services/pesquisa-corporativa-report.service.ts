import type {
  PesquisaCorporativa,
  PesquisaMetricas,
  PesquisaBloco,
} from "@/types";
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

export function generatePesquisaCorporativaReport(
  pesquisa: PesquisaCorporativa,
  metricas: PesquisaMetricas,
): void {
  const doc = createDoc();

  const subtitles = [sanitize(`Tipo: ${pesquisa.tipo}`)];
  if (pesquisa.categoria) subtitles.push(sanitize(`Categoria: ${pesquisa.categoria}`));
  if (pesquisa.periodo) subtitles.push(sanitize(`Periodo: ${pesquisa.periodo}`));

  let y = drawHeader(doc, sanitize(`Relatorio - ${pesquisa.titulo}`), subtitles);

  y = drawMetricCards(doc, buildMetricCards(metricas), y);
  drawQuestionAnalytics(doc, buildQuestionStats(pesquisa.blocos, metricas), 5, y);

  drawFooter(doc);
  doc.save(`pesquisa-${pesquisa.slug}.pdf`);
}
