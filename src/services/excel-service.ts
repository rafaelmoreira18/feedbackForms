import * as XLSX from "xlsx";
import { getScaleAverage } from "./analytics3-service";
import { formatDate } from "@/utils/format";
import type { Form3Response, Form3Filters, Form3Metrics, MetricsView } from "@/types";

function metricsViewLabel(view: MetricsView): string {
  if (view === 'satisfacao') return 'Satisfacao';
  if (view === 'avaliacao') return 'Avaliacao';
  return 'Ambos';
}

function buildFilterRows(filters: Form3Filters, metricsView: MetricsView): string[][] {
  const rows: string[][] = [["Filtros Aplicados", ""]];
  rows.push(["Data Inicial", filters.startDate ? formatDate(filters.startDate) : "Sem filtro"]);
  rows.push(["Data Final", filters.endDate ? formatDate(filters.endDate) : "Sem filtro"]);
  rows.push(["Setor", filters.formType ?? "Todos"]);
  if (filters.sortSatisfaction) {
    const label = filters.sortSatisfaction === "desc" ? "Maior para Menor" : "Menor para Maior";
    rows.push(["Ordenacao", label]);
  }
  rows.push(["Exibindo", metricsViewLabel(metricsView)]);
  return rows;
}

function buildMetricRows(metrics: Form3Metrics, metricsView: MetricsView): string[][] {
  const rows: string[][] = [["Metrica", "Valor"]];
  rows.push(["Total de Respostas", String(metrics.totalResponses)]);

  if (metricsView === 'satisfacao' || metricsView === 'ambos') {
    rows.push(["Satisfacao Media (1-4)", metrics.averageSatisfactionOnly.toFixed(2)]);
  }
  if (metricsView === 'avaliacao' || metricsView === 'ambos') {
    rows.push(["Avaliacao Media (1-4)", metrics.averageExperience.toFixed(2)]);
  }
  if (metricsView === 'ambos') {
    rows.push(["Media Geral (1-4)", metrics.averageSatisfaction.toFixed(2)]);
  }

  rows.push(["Recomendariam", `${metrics.averageNps}%`]);
  rows.push(["Respostas Este Mes", String(metrics.responsesThisMonth)]);
  rows.push(["Respostas Mes Anterior", String(metrics.responsesLastMonth)]);
  return rows;
}

export function generateExcelReport(
  forms: Form3Response[],
  metrics: Form3Metrics,
  filters: Form3Filters,
  metricsView: MetricsView = 'ambos',
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumo ──
  const resumoData: (string | number)[][] = [];
  resumoData.push(["Relatorio de Avaliacao"]);
  resumoData.push(["Gerado em", new Date().toLocaleString("pt-BR")]);
  resumoData.push([]);
  buildFilterRows(filters, metricsView).forEach((r) => resumoData.push(r));
  resumoData.push([]);
  buildMetricRows(metrics, metricsView).forEach((r) => resumoData.push(r));

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo["!cols"] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // ── Sheet 2: Respostas ──
  const headers = ["Nome do Paciente", "Setor", "CPF", "Genero", "Idade", "Media (1-4)", "Recomendaria", "Data"];
  const rows = forms.map((form) => {
    const avg = form.recusouResponder ? 0 : Math.round(getScaleAverage(form) * 100) / 100;
    const npsAnswer = form.answers.find((a) => a.questionId === "nps");
    const nps = npsAnswer ? (npsAnswer.value === 1 ? "Sim" : "Nao") : "N/A";
    return [
      form.patientName ?? "",
      form.formType ?? "",
      form.patientCpf ?? "Nao informado",
      form.patientGender ?? "",
      form.patientAge ?? "",
      avg,
      nps,
      formatDate(form.createdAt),
    ];
  });

  const wsRespostas = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsRespostas["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 12 },
    { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRespostas, "Respostas");

  XLSX.writeFile(wb, "relatorio-dashboard.xlsx");
}
