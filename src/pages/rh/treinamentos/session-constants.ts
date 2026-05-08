import type { TrainingType } from "@/types";

export const EFICACIA_QUESTIONS = [
  "Na prática, demonstrou/demonstraram ter adquirido novas técnicas e métodos aplicáveis ao trabalho?",
  "Apresentou/apresentaram ideias para a realização das tarefas?",
  "Desenvolveu/desenvolveram maior qualidade no trabalho, devido ao uso dos conteúdos aprendidos?",
  "Observou-se o aumento da produtividade do trabalho desenvolvido?",
  "Aplica/aplicaram satisfatoriamente regras de trabalho introduzidas?",
  "Demonstra/demonstraram iniciativa na solução de problemas relativos às questões treinadas?",
  "Compartilha/compartilham o conhecimento e habilidade adquirido entre a equipe de trabalho?",
];

export const REACAO_QUESTIONS = [
  "Clareza e objetividade do conteúdo",
  "Aplicabilidade do conteúdo na prática",
  "Qualidade dos materiais utilizados",
  "Domínio e didática do(a) facilitador(a)",
  "Tempo destinado ao treinamento",
  "Participação e engajamento",
  "Ambiente e estrutura física",
  "Qualidade dos equipamentos",
  "Organização geral do treinamento",
  "Satisfação geral com o treinamento",
];

export const EFICACIA_LABELS: Record<number, string> = { 1: "Ruim", 2: "Bom", 3: "Ótimo" };
export const REACAO_LABELS: Record<number, string> = {
  1: "Muito Insatisfeito",
  2: "Insatisfeito",
  3: "Neutro",
  4: "Satisfeito",
  5: "Muito Satisfeito",
};

export const EFICACIA_COLORS: Record<number, string> = {
  1: "bg-red-base/10 text-red-base border border-red-base/30",
  2: "bg-teal-base/10 text-teal-base border border-teal-base/30",
  3: "bg-green-base/10 text-green-base border border-green-base/30",
};
export const REACAO_COLORS: Record<number, string> = {
  1: "bg-red-base/10 text-red-base border border-red-base/30",
  2: "bg-orange-100 text-orange-500 border border-orange-300",
  3: "bg-yellow-50 text-yellow-600 border border-yellow-300",
  4: "bg-teal-base/10 text-teal-base border border-teal-base/30",
  5: "bg-green-base/10 text-green-base border border-green-base/30",
};

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  eficacia: "Avaliação de Eficácia de Treinamento",
  reacao: "Avaliação de Reação — Treinamento",
};
