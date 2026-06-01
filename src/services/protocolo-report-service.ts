import jsPDF from "jspdf";
import type { ProtocoloMetrics, ProtocoloIndicador } from "@/types";

const COLORS = {
  primary: [0, 127, 142] as const, // teal-dark
  dark: [30, 30, 30] as const,
  gray: [100, 100, 100] as const,
  lightGray: [200, 200, 200] as const,
  white: [255, 255, 255] as const,
  green: [82, 163, 80] as const,
  red: [231, 76, 60] as const,
};

const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const INDICADOR_LABELS: { key: keyof ProtocoloMetrics["indicadores"]; label: string }[] = [
  { key: "portaTriagem5", label: "Porta-Triagem <= 5 min" },
  { key: "triagemEcg5", label: "Triagem -> ECG <= 5 min" },
  { key: "ecgInterpretacao5", label: "ECG -> Interpretacao <= 5 min" },
  { key: "portaEcg10", label: "Porta-ECG total <= 10 min" },
  { key: "portaAgulha30", label: "Porta-Agulha <= 30 min" },
  { key: "eficaciaTrombolise", label: "Eficacia da trombolise" },
  { key: "transferenciaMeta", label: "Transferencia dentro da meta" },
  { key: "completude", label: "Completude do protocolo" },
];

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

export function generateProtocoloReport(
  metrics: ProtocoloMetrics,
  unidadeNome: string,
  filters?: { startDate?: string; endDate?: string },
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString("pt-BR");

  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Indicadores - Protocolo de Dor Toracica", PAGE_MARGIN, 24);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Unidade: ${unidadeNome}`, PAGE_MARGIN, 31);
  doc.text(`Gerado em: ${generatedAt}`, PAGE_MARGIN, 36);
  const periodo =
    filters?.startDate || filters?.endDate
      ? `Periodo: ${filters?.startDate ?? "inicio"} a ${filters?.endDate ?? "hoje"}`
      : "Periodo: todos os atendimentos";
  doc.text(periodo, PAGE_MARGIN, 41);

  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, 45, PAGE_WIDTH - PAGE_MARGIN, 45);

  // Volume cards
  let y = 52;
  const vol: { title: string; value: string }[] = [
    { title: "Total de protocolos", value: String(metrics.total) },
    { title: "Em aberto", value: String(metrics.abertos) },
    { title: "Concluidos", value: String(metrics.concluidos) },
  ];
  const perRow = 3, gap = 3;
  const cardW = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
  const cardH = 24;
  vol.forEach((c, i) => {
    const x = PAGE_MARGIN + (i % perRow) * (cardW + gap);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(c.title, x + cardW / 2, y + 9, { align: "center" });
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(c.value, x + cardW / 2, y + 19, { align: "center" });
  });
  y += cardH + 12;

  // Indicators table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("Indicadores (FORMMED026)", PAGE_MARGIN, y);
  y += 8;

  const colW = [88, 26, 26, 30];
  const headers = ["Indicador", "Resultado", "Meta", "Status"];
  const rowH = 9;
  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowH, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  let xPos = PAGE_MARGIN + 2;
  headers.forEach((h, i) => { doc.text(h, xPos, y + 6); xPos += colW[i]; });
  y += rowH;

  doc.setFont("helvetica", "normal");
  INDICADOR_LABELS.forEach((item, index) => {
    y = checkPageBreak(doc, y, rowH);
    const ind: ProtocoloIndicador = metrics.indicadores[item.key];
    const atinge = ind.percentual >= ind.meta;
    if (index % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowH, "F");
    }
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    xPos = PAGE_MARGIN + 2;
    doc.text(item.label, xPos, y + 6); xPos += colW[0];
    doc.text(`${ind.percentual}% (${ind.numerador}/${ind.denominador})`, xPos, y + 6); xPos += colW[1];
    doc.text(`>= ${ind.meta}%`, xPos, y + 6); xPos += colW[2];
    const statusColor = atinge ? COLORS.green : COLORS.red;
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(atinge ? "OK" : "Abaixo", xPos, y + 6);
    doc.setFont("helvetica", "normal");
    y += rowH;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Pagina ${i} de ${totalPages}`, PAGE_WIDTH / 2, 290, { align: "center" });
  }

  doc.save("indicadores-protocolo-dor-toracica.pdf");
}
