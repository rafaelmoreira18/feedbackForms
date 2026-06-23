import type {
  AnxietyAnswer,
  AnxietyClassification,
  AnxietyInstrument,
} from './anxiety-assessment.entity';

/** Quantidade de itens esperada por instrumento. */
export const ANXIETY_ITEM_COUNT: Record<AnxietyInstrument, number> = {
  bai: 21,
  gad7: 7,
};

/** Faixa de classificação — `max` é o limite superior inclusivo do escore. */
interface Band {
  max: number;
  classificacao: AnxietyClassification;
}

/**
 * Faixas clínicas padrão.
 *   BAI   (0..63): 0-7 mínima · 8-15 leve · 16-25 moderada · 26-63 grave
 *   GAD-7 (0..21): 0-4 mínima · 5-9 leve · 10-14 moderada · 15-21 grave
 */
const BANDS: Record<AnxietyInstrument, Band[]> = {
  bai: [
    { max: 7, classificacao: 'minima' },
    { max: 15, classificacao: 'leve' },
    { max: 25, classificacao: 'moderada' },
    { max: 63, classificacao: 'grave' },
  ],
  gad7: [
    { max: 4, classificacao: 'minima' },
    { max: 9, classificacao: 'leve' },
    { max: 14, classificacao: 'moderada' },
    { max: 21, classificacao: 'grave' },
  ],
};

/** Soma o escore total e deriva a classificação de gravidade. */
export function scoreAnxiety(
  instrument: AnxietyInstrument,
  answers: AnxietyAnswer[],
): { escore: number; classificacao: AnxietyClassification } {
  const escore = answers.reduce((sum, a) => sum + a.value, 0);
  const bands = BANDS[instrument];
  const band = bands.find((b) => escore <= b.max) ?? bands[bands.length - 1];
  return { escore, classificacao: band.classificacao };
}
