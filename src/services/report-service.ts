import jsPDF from "jspdf";
import { getScaleAverage } from "./analytics3-service";
import { formatDate, formatRating } from "@/utils/format";
import type { Form3Response, Form3Filters, Form3Metrics } from "@/types";

const COLORS = {
  primary: [41, 98, 255] as const,
  dark: [30, 30, 30] as const,
  gray: [100, 100, 100] as const,
  lightGray: [200, 200, 200] as const,
  white: [255, 255, 255] as const,
  headerBg: [41, 98, 255] as const,
  rowAlt: [245, 247, 250] as const,
};

const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

function buildFilterDescription(filters: Form3Filters): string {
  const parts: string[] = [];
  if (filters.startDate) parts.push(`De: ${formatDate(filters.startDate)}`);
  if (filters.endDate) parts.push(`Ate: ${formatDate(filters.endDate)}`);
  if (filters.formType) parts.push(`Setor: ${filters.formType}`);
  if (filters.sortSatisfaction) {
    const label = filters.sortSatisfaction === "desc" ? "Maior para Menor" : "Menor para Maior";
    parts.push(`Ordenacao: ${label}`);
  }
  return parts.length > 0 ? parts.join(" | ") : "Sem filtros aplicados";
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

function drawMetricCards(doc: jsPDF, metrics: Form3Metrics, y: number): number {
  const cardWidth = (CONTENT_WIDTH - 6) / 3;
  const cardHeight = 28;
  const cards = [
    { title: "Total de Respostas", value: String(metrics.totalResponses) },
    { title: "Satisfacao Media (1-4)", value: formatRating(metrics.averageSatisfaction) },
    { title: "Media NPS (0-10)", value: `${metrics.averageNps}/10` },
  ];

  cards.forEach((card, i) => {
    const x = PAGE_MARGIN + i * (cardWidth + 3);
    doc.setFillColor(...COLORS.headerBg);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.title, x + cardWidth / 2, y + 10, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardWidth / 2, y + 22, { align: "center" });
  });

  return y + cardHeight + 10;
}

function drawResponsesTable(
  doc: jsPDF,
  forms: Form3Response[],
  totalCount: number,
  y: number,
): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(`Respostas (${forms.length})`, PAGE_MARGIN, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`${forms.length} de ${totalCount} respostas no total`, PAGE_MARGIN, y + 5);
  y += 12;

  const colWidths = [44, 40, 32, 28, 26];
  const headers = ["Nome do Paciente", "Setor Avaliado", "CPF", "Satisfacao", "Data"];
  const rowHeight = 8;

  doc.setFillColor(...COLORS.headerBg);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);

  let xPos = PAGE_MARGIN + 2;
  headers.forEach((header, i) => {
    doc.text(header, xPos, y + 5.5);
    xPos += colWidths[i];
  });
  y += rowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  forms.forEach((form, index) => {
    y = checkPageBreak(doc, y, rowHeight);

    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setTextColor(...COLORS.dark);
    const avg = getScaleAverage(form);
    const row = [
      String(form.patientName ?? "").substring(0, 22),
      String(form.formType ?? "").substring(0, 16),
      String(form.patientCpf ?? ""),
      formatRating(Math.round(avg * 10) / 10),
      formatDate(form.createdAt),
    ];

    xPos = PAGE_MARGIN + 2;
    row.forEach((cell, i) => {
      doc.text(String(cell), xPos, y + 5.5);
      xPos += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

export function generateDashboardReport(
  forms: Form3Response[],
  metrics: Form3Metrics,
  filters: Form3Filters,
  totalFormsCount: number,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString("pt-BR");

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Relatorio de Avaliacao", PAGE_MARGIN, 25);

  // Generated at
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Gerado em: ${generatedAt}`, PAGE_MARGIN, 32);

  // Filter info
  const filterText = buildFilterDescription(filters);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Filtros: ${filterText}`, PAGE_MARGIN, 38);

  // Separator
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, 42, PAGE_WIDTH - PAGE_MARGIN, 42);

  // Metric cards
  let y = drawMetricCards(doc, metrics, 48);

  // Separator
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, y - 4, PAGE_WIDTH - PAGE_MARGIN, y - 4);

  // Responses table
  y = drawResponsesTable(doc, forms, totalFormsCount, y + 2);

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Pagina ${i} de ${totalPages}`, PAGE_WIDTH / 2, 290, { align: "center" });
  }

  doc.save("relatorio-dashboard.pdf");
}
