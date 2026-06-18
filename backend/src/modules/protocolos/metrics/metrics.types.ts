import type { Indicador } from '../utils/indicador.util';

/** Campos comuns a todas as métricas de protocolo (qualquer tipo). */
export interface BaseMetrics {
  protocolType: string;
  total: number;
  abertos: number;
  concluidos: number;
  porEtapa: Record<string, number>;
  indicadores: Record<string, Indicador>;
  tendenciaMensal: { mes: string; total: number }[];
}

/** Métricas do Protocolo de Dor Torácica (FORMMED026) — shape consumido pelo dashboard atual. */
export interface DorToracicaMetrics extends BaseMetrics {
  porVia: { via_i: number; via_ii: number; via_iii: number; naoInformado: number };
  porRiscoHeart: { baixo: number; intermediario: number; alto: number; naoInformado: number };
}

/** Métricas do Protocolo de Sepse — bundle ILAS 2022 / SSC 2026. */
export interface SepseMetrics extends BaseMetrics {
  porClassificacao: Record<string, number>;
  porFoco: Record<string, number>;
  porDesfecho: Record<string, number>;
  porFaixaPhoenix: { sepse: number; choque_septico: number; incompleto: number; naoInformado: number };
}

export type ProtocoloMetrics = DorToracicaMetrics | SepseMetrics;
