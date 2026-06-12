/** Gera um slug URL-safe a partir de um texto (sem acentos, minúsculo, máx. 60 chars). */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** "HH:mm" → minutos desde a meia-noite, ou null se inválido. */
export function hhmmToMinutes(value?: string): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Diferença em minutos entre dois "HH:mm" no mesmo dia (cruza meia-noite se end < start). */
export function deltaMin(startHHmm?: string, endHHmm?: string): number | null {
  const s = hhmmToMinutes(startHHmm);
  const e = hhmmToMinutes(endHHmm);
  if (s === null || e === null) return null;
  let d = e - s;
  if (d < 0) d += 24 * 60; // virada de dia
  return d;
}
