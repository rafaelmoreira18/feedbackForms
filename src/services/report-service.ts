import jsPDF from "jspdf";
import type { ReportData } from "../types/report";
import { formService } from "./form-service";
import { formatDate, formatRating } from "../utils/format";

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

function buildFilterDescription(data: ReportData): string {
  const parts: string[] = [];

  if (data.filters.startDate) {
    parts.push(`De: ${formatDate(data.filters.startDate)}`);
  }
  if (data.filters.endDate) {
    parts.push(`Ate: ${formatDate(data.filters.endDate)}`);
  }
  if (data.filters.evaluatedDepartment) {
    parts.push(`Departamento: ${data.filters.evaluatedDepartment}`);
  }
  if (data.filters.sortSatisfaction) {
    const label =
      data.filters.sortSatisfaction === "desc"
        ? "Maior para Menor"
        : "Menor para Maior";
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

function drawMetricCards(doc: jsPDF, data: ReportData, y: number): number {
  const cardWidth = (CONTENT_WIDTH - 6) / 3;
  const cardHeight = 28;
  const metrics = [
    {
      title: "Total de Respostas",
      value: String(data.metrics.totalResponses),
    },
    {
      title: "Satisfacao Media",
      value: formatRating(data.metrics.averageSatisfaction),
    },
    {
      title: "Taxa de Recomendacao",
      value: `${data.metrics.recommendationRate}%`,
    },
  ];

  metrics.forEach((metric, i) => {
    const x = PAGE_MARGIN + i * (cardWidth + 3);

    doc.setFillColor(...COLORS.headerBg);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(metric.title, x + cardWidth / 2, y + 10, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + cardWidth / 2, y + 22, { align: "center" });
  });

  return y + cardHeight + 10;
}

function drawResponsesTable(
  doc: jsPDF,
  data: ReportData,
  y: number,
): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(`Respostas (${data.responses.length})`, PAGE_MARGIN, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`${data.responses.length} de ${data.totalFormsCount} respostas no total`, PAGE_MARGIN, y + 5);
  y += 12;

  const colWidths = [44, 40, 32, 28, 26];
  const headers = ["Nome do Paciente", "Departamento Avaliado", "CPF", "Satisfacao", "Data"];
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

  data.responses.forEach((form, index) => {
    y = checkPageBreak(doc, y, rowHeight);

    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setTextColor(...COLORS.dark);
    const avg = formService.getAverageSatisfaction(form);
    const row = [
      String(form.patientName ?? "").substring(0, 22),
      String(form.evaluatedDepartment ?? "").substring(0, 16),
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

export function generateDashboardReport(data: ReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Relatorio de avaliação", PAGE_MARGIN, 25);

  // Generated at
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Gerado em: ${data.generatedAt}`, PAGE_MARGIN, 32);

  // Filter info
  const filterText = buildFilterDescription(data);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Filtros: ${filterText}`, PAGE_MARGIN, 38);

  // Separator
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, 42, PAGE_WIDTH - PAGE_MARGIN, 42);

  // Metric cards
  let y = drawMetricCards(doc, data, 48);

  // Separator
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, y - 4, PAGE_WIDTH - PAGE_MARGIN, y - 4);

  // Responses table
  y = drawResponsesTable(doc, data, y + 2);

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Pagina ${i} de ${totalPages}`,
      PAGE_WIDTH / 2,
      290,
      { align: "center" },
    );
  }

  doc.save("relatorio-dashboard.pdf");
}
