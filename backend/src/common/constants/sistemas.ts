/**
 * Sistemas disponíveis na plataforma.
 * Usado para validar o campo `sistemas[]` nos usuários e no SistemaGuard.
 */
export const SISTEMAS_DISPONIVEIS = ['feedbackforms', 'linensistem'] as const;

export type Sistema = (typeof SISTEMAS_DISPONIVEIS)[number];
