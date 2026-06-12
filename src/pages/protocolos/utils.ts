/** Extrai a mensagem de erro de uma resposta da API (axios), com fallback. */
export function extractApiError(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return typeof msg === "string" ? msg : fallback;
}

/** Formata um ISO datetime no padrão pt-BR curto (dd/mm/aa hh:mm). */
export function fmtDataHora(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
