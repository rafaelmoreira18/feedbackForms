import jsPDF from "jspdf";
import type { Pdi, PdiResponsabilidade } from "@/types";
import { competencyById } from "@/pages/rh/avaliacao-desempenho/competencies";

const COLORS = {
  primary: [13, 148, 136] as const, // teal-base
  dark: [30, 30, 30] as const,
  gray: [100, 100, 100] as const,
  lightGray: [200, 200, 200] as const,
  white: [255, 255, 255] as const,
  headerBg: [13, 148, 136] as const,
  rowAlt: [240, 250, 248] as const,
};

const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const RESP_LABEL: Record<PdiResponsabilidade, string> = {
  colaborador: "Colaborador",
  empresa: "Empresa",
};

function formatDateBr(iso: string | null): string {
  if (!iso) return "—";
  // aceita "2026-05-28" ou ISO completo
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

/** Escreve um parágrafo com quebra automática; retorna o novo y. */
function drawParagraph(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.dark);
  const lines = doc.splitTextToSize(text || "—", CONTENT_WIDTH);
  for (const line of lines) {
    y = checkPageBreak(doc, y, 6);
    doc.text(line, PAGE_MARGIN, y);
    y += 5;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = checkPageBreak(doc, y, 12);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(title, PAGE_MARGIN, y);
  return y + 6;
}

/**
 * Gera o PDF do PDI concluído: cabeçalho, tabela de ações de desenvolvimento,
 * feedback final do gestor e validação do colaborador.
 */
export function generatePdiReport(pdi: Pdi): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString("pt-BR");

  // ── Título ──────────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("PDI - Plano de Desenvolvimento Individual", PAGE_MARGIN, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Gerado em: ${generatedAt}`, PAGE_MARGIN, 28);

  // ── Cabeçalho do colaborador ────────────────────────────────────────────────
  let y = 36;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  const headerLines = [
    `Colaborador: ${pdi.colaboradorNome}`,
    `Cargo: ${pdi.cargo || "—"}   |   Setor: ${pdi.setor || "—"}`,
    `Gestor(a) da Área: ${pdi.gestorArea || "—"}   |   Avaliador(a): ${pdi.avaliador || "—"}`,
    pdi.projeto ? `Projeto: ${pdi.projeto}` : null,
    `Data da Avaliação: ${formatDateBr(pdi.dataAvaliacao)}`,
  ].filter(Boolean) as string[];
  headerLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, y);
    y += 5;
  });
  y += 2;

  doc.setDrawColor(...COLORS.lightGray);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 8;

  // ── Tabela de ações ─────────────────────────────────────────────────────────
  y = sectionTitle(doc, "Ações de Desenvolvimento", y);

  const colWidths = [78, 30, 40, 22]; // Ação | Responsabilidade | Competência | Prazo
  const headers = ["Ação", "Responsável", "Competência", "Prazo"];
  const headerHeight = 8;

  function drawTableHeader(yPos: number): number {
    doc.setFillColor(...COLORS.headerBg);
    doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, headerHeight, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    let x = PAGE_MARGIN + 2;
    headers.forEach((h, i) => {
      doc.text(h, x, yPos + 5.5);
      x += colWidths[i];
    });
    return yPos + headerHeight;
  }

  y = drawTableHeader(y);

  const actions = pdi.actions ?? [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  actions.forEach((a, index) => {
    const compLabel = competencyById(a.competenciaId)?.label ?? a.competenciaId;
    const acaoLines = doc.splitTextToSize(a.acao || "—", colWidths[0] - 3);
    const compLines = doc.splitTextToSize(compLabel, colWidths[2] - 3);
    const lineCount = Math.max(acaoLines.length, compLines.length, 1);
    const rowHeight = lineCount * 4.5 + 3;

    // quebra de página: redesenha o cabeçalho
    if (y + rowHeight > 280) {
      doc.addPage();
      y = PAGE_MARGIN;
      y = drawTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setTextColor(...COLORS.dark);
    let x = PAGE_MARGIN + 2;
    const yText = y + 5;
    // Ação (multilinha)
    doc.text(acaoLines, x, yText);
    x += colWidths[0];
    // Responsável
    doc.text(RESP_LABEL[a.responsabilidade] ?? a.responsabilidade, x, yText);
    x += colWidths[1];
    // Competência (multilinha)
    doc.text(compLines, x, yText);
    x += colWidths[2];
    // Prazo
    doc.text(formatDateBr(a.prazo), x, yText);

    y += rowHeight;
  });

  if (actions.length === 0) {
    doc.setTextColor(...COLORS.gray);
    doc.text("Nenhuma ação registrada.", PAGE_MARGIN + 2, y + 5);
    y += 10;
  }

  y += 6;

  // ── Feedback final do gestor ────────────────────────────────────────────────
  y = sectionTitle(doc, "Feedback Final do Gestor", y);
  y = drawParagraph(doc, pdi.managerFeedback ?? "—", y);
  y += 6;

  // ── Validação do colaborador ────────────────────────────────────────────────
  y = sectionTitle(doc, "Validação do Colaborador", y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.dark);
  y = checkPageBreak(doc, y, 6);
  doc.text(`Nome: ${pdi.colaboradorNomeValidacao ?? "—"}`, PAGE_MARGIN, y);
  y += 5;
  y = checkPageBreak(doc, y, 6);
  doc.text(`Validado em: ${formatDateBr(pdi.colaboradorSubmittedAt)}`, PAGE_MARGIN, y);
  y += 6;
  if (pdi.colaboradorComentario) {
    y = drawParagraph(doc, `Comentário: ${pdi.colaboradorComentario}`, y);
  }

  // ── Rodapé ──────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Página ${i} de ${totalPages}`, PAGE_WIDTH / 2, 290, { align: "center" });
  }

  const safeName = pdi.colaboradorNome.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`pdi-${safeName}.pdf`);
}
