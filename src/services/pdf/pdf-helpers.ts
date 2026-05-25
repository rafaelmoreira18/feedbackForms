import jsPDF from "jspdf";

export const PDF_COLORS = {
  primary: [41, 98, 255] as const,
  dark: [30, 30, 30] as const,
  gray: [100, 100, 100] as const,
  lightGray: [200, 200, 200] as const,
  white: [255, 255, 255] as const,
  headerBg: [41, 98, 255] as const,
  rowAlt: [245, 247, 250] as const,
};

export const PAGE_MARGIN = 20;
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const PAGE_BOTTOM = PAGE_HEIGHT - 17;

export function createDoc(): jsPDF {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

export function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

export function drawHeader(doc: jsPDF, title: string, subtitles: string[]): number {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title, PAGE_MARGIN, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, PAGE_MARGIN, 32);

  let y = 38;
  subtitles.forEach((line) => {
    doc.text(line, PAGE_MARGIN, y);
    y += 5;
  });

  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  return y + 6;
}

export interface MetricCard {
  title: string;
  value: string;
  subtitle?: string;
}

export function drawMetricCards(doc: jsPDF, cards: MetricCard[], y: number): number {
  if (cards.length === 0) return y;
  const perRow = Math.min(3, cards.length);
  const gap = 3;
  const cardWidth = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
  const cardHeight = 28;
  const rowGap = 4;

  cards.forEach((card, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = PAGE_MARGIN + col * (cardWidth + gap);
    const cy = y + row * (cardHeight + rowGap);
    doc.setFillColor(...PDF_COLORS.headerBg);
    doc.roundedRect(x, cy, cardWidth, cardHeight, 2, 2, "F");
    doc.setTextColor(...PDF_COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.title, x + cardWidth / 2, cy + 9, { align: "center" });
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardWidth / 2, cy + 19, { align: "center" });
    if (card.subtitle) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(card.subtitle, x + cardWidth / 2, cy + 25, { align: "center" });
    }
  });

  const totalRows = Math.ceil(cards.length / perRow);
  return y + totalRows * cardHeight + (totalRows - 1) * rowGap + 8;
}

export interface QuestionStat {
  text: string;
  avg: number;
  count: number;
}

export function drawQuestionAnalytics(
  doc: jsPDF,
  questions: QuestionStat[],
  scaleMax: number,
  y: number,
): number {
  if (questions.length === 0) return y;

  y = checkPageBreak(doc, y, 12);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text("Analise por Pergunta", PAGE_MARGIN, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(`Escala 1-${scaleMax}`, PAGE_MARGIN, y + 4);
  y += 9;

  const barWidth = CONTENT_WIDTH - 30;
  const rowHeight = 11;

  questions.forEach((q) => {
    y = checkPageBreak(doc, y, rowHeight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.dark);
    const wrapped = doc.splitTextToSize(q.text, barWidth - 4);
    const firstLine = String(wrapped[0] ?? "");
    doc.text(firstLine, PAGE_MARGIN, y);

    doc.setFont("helvetica", "bold");
    doc.text(`${q.avg.toFixed(1)}/${scaleMax}`, PAGE_WIDTH - PAGE_MARGIN, y, { align: "right" });

    doc.setFillColor(229, 231, 235);
    doc.roundedRect(PAGE_MARGIN, y + 2, barWidth, 3, 1, 1, "F");
    const pct = Math.min(1, Math.max(0, q.avg / scaleMax));
    doc.setFillColor(...PDF_COLORS.headerBg);
    doc.roundedRect(PAGE_MARGIN, y + 2, barWidth * pct, 3, 1, 1, "F");

    y += rowHeight;
  });

  return y + 4;
}

export function drawFooter(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(`Pagina ${i} de ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 7, { align: "center" });
  }
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number, subtitle?: string): number {
  y = checkPageBreak(doc, y, subtitle ? 13 : 9);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text(title, PAGE_MARGIN, y);
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(subtitle, PAGE_MARGIN, y + 4);
    return y + 9;
  }
  return y + 6;
}

export function sanitize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
