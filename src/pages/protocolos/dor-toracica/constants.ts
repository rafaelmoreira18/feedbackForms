import type { ProtocoloStage } from "@/types";

/** Bloco preenchível do protocolo (etapas que têm formulário). */
export type BlocoKey = "triagem" | "ecg" | "investigacao" | "desfecho";

/** Blocos preenchíveis, na ordem do fluxo. */
export const BLOCOS: BlocoKey[] = ["triagem", "ecg", "investigacao", "desfecho"];

/** Metadados de cada bloco: título, equipe responsável e rótulo do registro profissional. */
export const STAGE_META: Record<BlocoKey, { titulo: string; equipe: string; registroLabel: string }> = {
  triagem: { titulo: "Triagem", equipe: "Equipe de Enfermagem", registroLabel: "COREN" },
  ecg: { titulo: "ECG", equipe: "Enfermagem / Médico", registroLabel: "COREN / CRM" },
  investigacao: { titulo: "Investigação", equipe: "Enfermagem / Médico", registroLabel: "COREN / CRM" },
  desfecho: { titulo: "Desfecho", equipe: "Médico", registroLabel: "CRM" },
};

/** Título curto da etapa, incluindo "Concluído" (usado em badges/listas). */
export const STAGE_LABEL: Record<ProtocoloStage, string> = {
  triagem: "Triagem",
  ecg: "ECG",
  investigacao: "Investigação",
  desfecho: "Desfecho",
  concluido: "Concluído",
};

/** Cor do badge por etapa. */
export const STAGE_STYLE: Record<ProtocoloStage, string> = {
  triagem: "bg-purple-base text-white",
  ecg: "bg-blue-base text-white",
  investigacao: "bg-violet-base text-white",
  desfecho: "bg-aqua-base text-white",
  concluido: "bg-green-base text-white",
};

// ── Rótulos do histórico de alterações ──────────────────────────────────────
/** Rótulos curtos por caminho de campo (fallback: último segmento "prettificado"). */
export const CAMPO_LABEL: Record<string, string> = {
  inicioTriagem: "Início triagem", classificacaoManchester: "Manchester",
  "sinaisVitais.paMsd": "PA MSD", "sinaisVitais.paMse": "PA MSE", "sinaisVitais.fc": "FC",
  "sinaisVitais.fr": "FR", "sinaisVitais.spo2": "SpO₂", "sinaisVitais.tax": "Tax", "sinaisVitais.glicemia": "Glicemia",
  "queixaPrincipal.dorToracica": "Dor torácica", "queixaPrincipal.dispneiaSubita": "Dispneia",
  "queixaPrincipal.sudoreseNauseaSincope": "Sudorese/náusea", "queixaPrincipal.dorIrradiada": "Dor irradiada",
  inicioSintomasData: "Início sintomas", inicioSintomasHora: "Hora sintomas",
  alergias: "Alergias", alergiasDescricao: "Quais alergias", instabilidade: "Instabilidade",
  primeiroEcgHora: "1º ECG", interpretacaoMedicaHora: "Interpretação", resultadoEcg: "Resultado ECG",
  "derivacoesExtras.v3rV4r": "V3R/V4R", "derivacoesExtras.v7v9": "V7–V9", "derivacoesExtras.ecgSeriado": "ECG seriado",
  lsnUnidade: "LSN", troponinaInterpretacao: "Troponina", condutaHeart: "Conduta HEART",
  resultadoQualitativo: "Resultado (Pos/Neg)", modo: "Modo do resultado",
  heartTotal: "HEART total", heartFaixaRisco: "Risco HEART",
  destino: "Destino", solicitacaoRegulacaoHora: "Sol. regulação", saidaEfetivaHora: "Saída",
  "diagnosticos.naoSeAplica": "Dx N/A", "diagnosticos.dissecaoAorta": "Dissecção aorta", "diagnosticos.tep": "TEP",
};

/** Rótulos amigáveis de valores (enums/booleanos) no histórico. */
export const VALOR_LABEL: Record<string, string> = {
  true: "Sim", false: "Não", "": "—",
  negativo: "Negativo", positivo: "Positivo", quantitativo: "ng/mL", qualitativo: "Pos/Neg",
  vermelho: "Vermelho", laranja: "Laranja",
  via_i: "VIA I", via_ii: "VIA II", via_iii: "VIA III",
  rule_in: "Rule-in", rule_out: "Rule-out", inconclusivo: "Inconclusivo",
  alta_segura: "Alta segura", observacao: "Observação", internacao: "Internação",
  baixo: "Baixo", intermediario: "Intermediário", alto: "Alto",
};

/** Nome amigável de um caminho de campo (ex.: "sinaisVitais.fc" → "FC"). */
export function labelCampo(caminho: string): string {
  if (CAMPO_LABEL[caminho]) return CAMPO_LABEL[caminho];
  const ult = caminho.split(".").pop() ?? caminho;
  return ult.charAt(0).toUpperCase() + ult.slice(1).replace(/([A-Z])/g, " $1");
}

/** Valor amigável (enum/boolean) para exibição no histórico. */
export function labelValor(v: string): string {
  return VALOR_LABEL[v] ?? (v === "" ? "—" : v);
}
