import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MetricsView } from "@/types";

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatRating(value: number): string {
  return `${value.toFixed(1)}/4`;
}

const METRICS_VIEW_LABELS: Record<MetricsView, string> = {
  satisfacao: "Satisfação",
  avaliacao: "Avaliação",
  ambos: "Ambos",
};

export function metricsViewLabel(view: MetricsView): string {
  return METRICS_VIEW_LABELS[view];
}

export const NPS_VALUE_LABEL: Record<number, string> = { 1: "Sim", 0: "Não" };
