/** Indicador de qualidade (FORMMED026): numerador/denominador, percentual e meta. */
export interface Indicador {
  numerador: number;
  denominador: number;
  percentual: number;
  meta: number;
}

export function indicador(numerador: number, denominador: number, meta: number): Indicador {
  return {
    numerador,
    denominador,
    percentual: denominador > 0 ? Math.round((numerador / denominador) * 1000) / 10 : 0,
    meta,
  };
}
