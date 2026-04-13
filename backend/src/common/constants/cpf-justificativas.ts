/**
 * Allowed justifications for not providing a patient CPF at form submission.
 * Presented as a selector to nurses conducting the interview.
 */
export const CPF_JUSTIFICATIVAS = [
  'Paciente não possui CPF',
  'Paciente não soube informar',
  'Responsável não soube informar',
  'Paciente estrangeiro',
  'Recusa em informar',
  'Documento não estava disponível',
] as const;

export type CpfJustificativa = (typeof CPF_JUSTIFICATIVAS)[number];
