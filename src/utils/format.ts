import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  return `${value.toFixed(1)}/5`;
}
