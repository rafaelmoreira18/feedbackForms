import type { AlteracaoCampo, BlocoKey } from '../protocolo-types';

/**
 * Mescla `patch` sobre `base` (1 nível de profundidade). Objetos aninhados são
 * combinados campo-a-campo; valores escalares do patch substituem os da base.
 * Usado na edição de etapa para não apagar campos que o cliente não enviou.
 */
export function mergeBloco(base: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    // null/undefined no patch não apaga um valor existente na base (evita zerar sub-objetos).
    if (v === null || v === undefined) {
      if (cur === undefined) out[k] = v;
      continue;
    }
    if (
      typeof v === 'object' && !Array.isArray(v) &&
      cur !== null && typeof cur === 'object' && !Array.isArray(cur)
    ) {
      out[k] = { ...(cur as object), ...(v as object) };
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Achata um objeto em pares "caminho.do.campo" → valor primitivo (string). */
export function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== 'object') {
    out[prefix] = String(obj);
    return out;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      Object.assign(out, flatten(v, path));
    } else {
      out[path] = v === null || v === undefined ? '' : String(v);
    }
  }
  return out;
}

/**
 * Calcula o diff campo-a-campo entre o estado anterior e o novo de um bloco.
 * Ignora os campos de responsável/fechamento (ruído de auditoria).
 */
export function diffCampos(
  bloco: BlocoKey,
  anterior: unknown,
  novo: unknown,
  ctx: { userId: string | null; nome: string },
  em: string,
): AlteracaoCampo[] {
  const IGNORAR = new Set(['responsavelNome', 'registroProfissional', 'fechadoEm']);
  const a = flatten(anterior);
  const b = flatten(novo);
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)]);
  const alteracoes: AlteracaoCampo[] = [];
  for (const campo of chaves) {
    if (IGNORAR.has(campo.split('.').pop() ?? '')) continue;
    const de = a[campo] ?? '';
    const para = b[campo] ?? '';
    if (de !== para) {
      alteracoes.push({ bloco, campo, de, para, porUserId: ctx.userId, porNome: ctx.nome, em });
    }
  }
  return alteracoes;
}
