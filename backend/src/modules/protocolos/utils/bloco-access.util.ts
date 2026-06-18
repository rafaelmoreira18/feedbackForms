import type { ProtocoloEntity } from '../entities/protocolo.entity';

/**
 * Acesso genérico aos blocos por etapa. A fonte de verdade é o mapa `blocos`/`rascunhos`,
 * mas caímos para as colunas nomeadas legadas (Dor Torácica) quando o mapa ainda não foi
 * preenchido — isso torna o backfill da migração OPCIONAL e garante zero regressão tanto
 * em produção (antes do backfill) quanto em dev (DB_SYNCHRONIZE, sem rodar o .sql).
 */

/** Etapas de Dor Torácica que existiam como colunas nomeadas antes do mapa genérico. */
export const LEGACY_DT_KEYS = ['triagem', 'ecg', 'investigacao', 'desfecho'] as const;

/** Bloco fechado de uma etapa (mapa → fallback coluna legada). */
export function blocoOf<T = unknown>(p: ProtocoloEntity, key: string): T | null {
  const fromMap = (p.blocos as Record<string, unknown> | undefined)?.[key];
  if (fromMap != null) return fromMap as T;
  const legacy = (p as unknown as Record<string, unknown>)[key];
  return (legacy as T) ?? null;
}

/** Rascunho (stand-by) de uma etapa (mapa → fallback coluna legada `<key>Rascunho`). */
export function rascunhoOf<T = unknown>(p: ProtocoloEntity, key: string): T | null {
  const fromMap = (p.rascunhos as Record<string, unknown> | undefined)?.[key];
  if (fromMap != null) return fromMap as T;
  const legacy = (p as unknown as Record<string, unknown>)[`${key}Rascunho`];
  return (legacy as T) ?? null;
}

/**
 * Popula `blocos`/`rascunhos` a partir das colunas legadas quando o mapa estiver vazio.
 * Usado ao RETORNAR o protocolo para o cliente (não persiste) — o frontend lê sempre
 * `protocolo.blocos[stageKey]`. O mapa tem precedência sobre o legado.
 */
export function hydrateProtocolo(p: ProtocoloEntity): ProtocoloEntity {
  const blocos: Record<string, unknown> = { ...(p.blocos ?? {}) };
  const rascunhos: Record<string, unknown> = { ...(p.rascunhos ?? {}) };
  const rec = p as unknown as Record<string, unknown>;
  for (const k of LEGACY_DT_KEYS) {
    if (blocos[k] == null && rec[k] != null) blocos[k] = rec[k];
    const r = rec[`${k}Rascunho`];
    if (rascunhos[k] == null && r != null) rascunhos[k] = r;
  }
  p.blocos = blocos;
  p.rascunhos = rascunhos;
  return p;
}
