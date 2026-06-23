import { scoreAnxiety, ANXIETY_ITEM_COUNT } from './anxiety-scoring';

/** Constrói respostas que somam exatamente `target` (uma resposta basta para o cálculo). */
function answersSumming(target: number) {
  return [{ itemId: 1, value: target }];
}

describe('anxiety-scoring', () => {
  it('expõe a contagem de itens por instrumento', () => {
    expect(ANXIETY_ITEM_COUNT.bai).toBe(21);
    expect(ANXIETY_ITEM_COUNT.gad7).toBe(7);
  });

  describe('BAI — faixas 0-7 / 8-15 / 16-25 / 26-63', () => {
    const cases: Array<[number, string]> = [
      [0, 'minima'],
      [7, 'minima'],
      [8, 'leve'],
      [15, 'leve'],
      [16, 'moderada'],
      [25, 'moderada'],
      [26, 'grave'],
      [63, 'grave'],
    ];
    it.each(cases)('escore %i → %s', (escore, classificacao) => {
      const r = scoreAnxiety('bai', answersSumming(escore));
      expect(r.escore).toBe(escore);
      expect(r.classificacao).toBe(classificacao);
    });

    it('soma corretamente respostas item a item', () => {
      const answers = Array.from({ length: 21 }, (_, i) => ({ itemId: i + 1, value: 2 }));
      expect(scoreAnxiety('bai', answers)).toEqual({ escore: 42, classificacao: 'grave' });
    });
  });

  describe('GAD-7 — faixas 0-4 / 5-9 / 10-14 / 15-21', () => {
    const cases: Array<[number, string]> = [
      [0, 'minima'],
      [4, 'minima'],
      [5, 'leve'],
      [9, 'leve'],
      [10, 'moderada'],
      [14, 'moderada'],
      [15, 'grave'],
      [21, 'grave'],
    ];
    it.each(cases)('escore %i → %s', (escore, classificacao) => {
      const r = scoreAnxiety('gad7', answersSumming(escore));
      expect(r.escore).toBe(escore);
      expect(r.classificacao).toBe(classificacao);
    });
  });
});
