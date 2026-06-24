/** Etapas do Protocolo de AVC, na ordem do fluxo (exclui `concluido`). */
export const AVC_STAGES = ['abertura', 'avaliacao', 'imagem', 'trombolise', 'monitorizacao', 'desfecho'] as const;
export type AvcStageKey = (typeof AVC_STAGES)[number];

export const AVC_STAGE_META: Record<AvcStageKey, { titulo: string; equipe: string; registroLabel: string }> = {
  abertura: { titulo: 'Abertura', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  avaliacao: { titulo: 'Avaliação inicial', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  imagem: { titulo: 'Imagem / Fluxo', equipe: 'Médico / Imagem', registroLabel: 'CRM' },
  trombolise: { titulo: 'Trombólise', equipe: 'Médico', registroLabel: 'CRM' },
  monitorizacao: { titulo: 'Monitorização', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
  desfecho: { titulo: 'Desfecho', equipe: 'Médico', registroLabel: 'CRM' },
};

export const AVC_STAGE_LABEL: Record<string, string> = {
  abertura: 'Abertura',
  avaliacao: 'Avaliação',
  imagem: 'Imagem',
  trombolise: 'Trombólise',
  monitorizacao: 'Monitorização',
  desfecho: 'Desfecho',
  concluido: 'Concluído',
};

export const AVC_STAGE_STYLE: Record<string, string> = {
  abertura: 'bg-purple-base text-white',
  avaliacao: 'bg-blue-base text-white',
  imagem: 'bg-violet-base text-white',
  trombolise: 'bg-red-base text-white',
  monitorizacao: 'bg-aqua-base text-white',
  desfecho: 'bg-teal-base text-white',
  concluido: 'bg-green-base text-white',
};

// ── Rótulos do histórico de alterações (AVC) ────────────────────────────────────
const AVC_CAMPO_LABEL: Record<string, string> = {
  fmcHora: 'FMC (marco zero)', inicioSintomasHora: 'Início sintomas', lkwHora: 'LKW',
  tempoDesdeLkw: 'Tempo desde LKW', incertezaHorario: 'Incerteza horário',
  inicioTriagemHora: 'Início triagem', ativacaoCodigoAvcHora: 'Ativação Código AVC',
  classificacaoManchester: 'Manchester', preNotificacao: 'Pré-notificação', preNotificacaoHora: 'Pré-notif. (hora)',
  face: 'Face', braco: 'Braço', fala: 'Fala', tempoRegistrado: 'Tempo registrado',
  paInicial: 'PA inicial', fc: 'FC', fr: 'FR', spo2: 'SpO₂', temperatura: 'Temp.',
  glicemiaCapilar: 'Glicemia', pesoKg: 'Peso', glasgow: 'Glasgow', nihssInicial: 'NIHSS inicial',
  'anticoagulante.uso': 'Anticoagulante', 'anticoagulante.qual': 'Qual anticoagulante',
  fluxo: 'Fluxo', tcSolicitacaoHora: 'TC solicitada', tcInicioHora: 'TC iniciada', tcLaudoHora: 'TC laudo',
  aspects: 'ASPECTS', resultadoTc: 'Resultado TC', angioTcRealizada: 'Angio-TC', lvoSuspeita: 'LVO (grande vaso)',
  teleconsultaRealizada: 'Teleconsulta', teleconsultaHora: 'Teleconsulta (hora)',
  regulacaoAcionada: 'Regulação', regulacaoHora: 'Regulação (hora)', unidadeDestino: 'Unidade destino',
  aceiteVagaHora: 'Aceite vaga', saidaUnidadeHora: 'Saída unidade', didoMin: 'DIDO (min)',
  tromboliseIndicada: 'Trombólise indicada', motivoNaoTrombolise: 'Motivo não-trombólise',
  discussaoNeurologista: 'Discussão neuro', consentimentoFamiliar: 'Consentimento',
  pesoCalculo: 'Peso (cálculo)', doseTotal: 'Dose total', doseBolus: 'Dose bolus', doseInfusao: 'Dose infusão',
  bolusHora: 'Bolus (hora)', infusaoInicioHora: 'Infusão início', infusaoTerminoHora: 'Infusão término',
  doubleCheck: 'Double-check',
  deterioracaoNeurologica: 'Deterioração neuro', suspeitaSangramento: 'Suspeita sangramento',
  tcControleRealizada: 'TC controle', tcControleHora: 'TC controle (hora)',
  'fess.degluticao24h': 'Deglutição ≤24h', 'fess.fessFebre': 'FeSS febre',
  'fess.fessGlicemia': 'FeSS glicemia', 'fess.fessDegluticao': 'FeSS deglutição',
  diagnosticoFinal: 'Diagnóstico final', destino: 'Destino', nihssAlta: 'NIHSS alta', mrsAlta: 'mRS alta',
  antiagregacaoAlta: 'Antiagregação alta', consultaNeuro30d: 'Consulta neuro 30d',
};

const AVC_VALOR_LABEL: Record<string, string> = {
  true: 'Sim', false: 'Não', '': '—',
  normal: 'Normal', alterado: 'Alterado',
  vermelho: 'Vermelho', laranja: 'Laranja', outro: 'Outro',
  sim: 'Sim', nao: 'Não', na: 'N/A',
  a: 'Fluxo A (com TC)', b: 'Fluxo B (sem TC)',
  sem_hemorragia: 'Sem hemorragia',
  hemorragia_intraparenquimatosa: 'Hemorragia intraparenq.',
  hemorragia_subaracnoidea: 'Hemorragia subaracnóidea',
  sinais_precoces_isquemia: 'Sinais precoces de isquemia',
  tc_normal: 'TC normal',
  avc_isquemico: 'AVC isquêmico', avc_hemorragico: 'AVC hemorrágico', ait: 'AIT', mimics: 'Mimics',
  alta: 'Alta', internacao_enfermaria: 'Internação enfermaria', uti: 'UTI',
  transferencia: 'Transferência', obito: 'Óbito',
};

export function avcLabelCampo(caminho: string): string {
  if (AVC_CAMPO_LABEL[caminho]) return AVC_CAMPO_LABEL[caminho];
  const ult = caminho.split('.').pop() ?? caminho;
  return ult.charAt(0).toUpperCase() + ult.slice(1).replace(/([A-Z])/g, ' $1');
}

export function avcLabelValor(v: string): string {
  return AVC_VALOR_LABEL[v] ?? (v === '' ? '—' : v);
}
