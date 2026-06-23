/**
 * Converte um texto livre em um slug URL-safe (minúsculo, sem acentos,
 * hifenizado, no máximo 80 caracteres). Usado para gerar slugs por tenant.
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
