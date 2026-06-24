/**
 * Tipos de domínio do Protocolo de Dor Torácica (FORMMED027).
 * Separados da entity TypeORM — esta é a forma dos dados (blocos JSONB), não o
 * mapeamento de colunas. Mantidos em sincronia manual com o frontend (src/types).
 */

/**
 * Etapa/bloco corrente do protocolo. O preenchimento é sequencial e cada bloco,
 * ao ser fechado, libera o próximo. O fechamento da última etapa conclui o protocolo.
 *
 * As etapas concretas dependem do tipo de protocolo (ver `protocolo-definitions.ts`):
 *   Dor Torácica: triagem → ecg → investigacao → desfecho → concluido
 *   Sepse:        abertura → pacote1h → reavaliacao → desfecho → concluido
 *
 * Mantido como `string` (a ordem/validação vive na definição do tipo), com `concluido`
 * sempre representando o estado final.
 */
export type ProtocoloStage = string;

/** Chave de um bloco preenchível (etapa com formulário). Genérica por tipo de protocolo. */
export type BlocoKey = string;

/** Profissional que fechou um bloco (nome + nº de cadastro profissional: CRM/COREN/etc.) */
export interface ResponsavelBloco {
  responsavelNome: string;
  registroProfissional: string;
  /** ISO datetime do fechamento do bloco */
  fechadoEm: string;
}

// ── BLOCO 1 — TRIAGEM (ETAPA 1) ───────────────────────────────────────────────
export interface SinaisVitais {
  paMsd: string; // ex.: "120/80"
  paMse: string;
  fc: string; // bpm
  fr: string; // ipm
  spo2: string; // %
  tax: string; // °C
  glicemia: string; // mg/dL
}

export interface QueixaPrincipal {
  dorToracica: boolean;
  dispneiaSubita: boolean;
  sudoreseNauseaSincope: boolean;
  dorIrradiada: boolean; // braço, mandíbula, epigástrio
}

export type ResultadoEcg = 'via_i' | 'via_ii' | 'via_iii' | '';

export interface DerivacoesExtras {
  v3rV4r: boolean;
  v7v9: boolean;
  ecgSeriado: boolean;
}

export interface BlocoTriagem extends ResponsavelBloco {
  inicioTriagem: string; // "HH:mm"
  classificacaoManchester: 'vermelho' | 'laranja' | '';
  sinaisVitais: SinaisVitais;
  queixaPrincipal: QueixaPrincipal;
  inicioSintomasData: string; // "YYYY-MM-DD"
  inicioSintomasHora: string; // "HH:mm"
  alergias: boolean;
  alergiasDescricao: string;
  instabilidade: boolean; // se SIM → Sala Vermelha
}

// ── BLOCO ECG (ETAPA 2 — realizada em horário separado da triagem) ────────────
export interface BlocoEcg extends ResponsavelBloco {
  primeiroEcgHora: string; // "HH:mm"
  interpretacaoMedicaHora: string; // "HH:mm"
  resultadoEcg: ResultadoEcg;
  derivacoesExtras: DerivacoesExtras;
}

// ── BLOCO 2 — INVESTIGAÇÃO (Troponina + HEART + Dx diferenciais) ──────────────
export interface ColetaTroponina {
  horaColeta: string; // "HH:mm"
  // 'quantitativo' = valor em ng/mL (resultado); 'qualitativo' = Positivo/Negativo (resultadoQualitativo).
  // Coletas legadas (sem `modo`) são tratadas como quantitativas pelo frontend.
  modo: 'quantitativo' | 'qualitativo';
  resultado: string; // ng/mL (modo quantitativo)
  resultadoQualitativo: 'negativo' | 'positivo' | ''; // modo qualitativo
  horaResultadoLab: string; // "HH:mm"
}

export type FaixaRiscoHeart = 'baixo' | 'intermediario' | 'alto' | '';

export interface DiagnosticosDiferenciais {
  /** Nenhum diagnóstico diferencial se aplica ao paciente. Exclui os demais. */
  naoSeAplica: boolean;
  dissecaoAorta: boolean;
  dissecaoAortaAddRs: string;
  tep: boolean;
  tepWells: string;
  pericardite: boolean;
  takotsubo: boolean;
  pneumotorax: boolean;
  tamponamento: boolean;
}

export interface BlocoInvestigacao extends ResponsavelBloco {
  // Troponina convencional 0-3-6h
  lsnUnidade: string; // ng/mL
  coleta0h: ColetaTroponina;
  coleta3h: ColetaTroponina;
  coleta3hDeltaPct: string; // (3h-0h)/0h × 100
  coleta6h: ColetaTroponina;
  troponinaInterpretacao: 'rule_in' | 'rule_out' | 'inconclusivo' | '';
  // Escore HEART (cada item 0/1/2)
  heartH: number;
  heartE: number;
  heartA: number;
  heartR: number;
  heartT: number;
  heartTotal: number; // 0-10
  heartFaixaRisco: FaixaRiscoHeart;
  condutaHeart: 'alta_segura' | 'observacao' | 'internacao' | '';
  // Diagnósticos diferenciais
  diagnosticos: DiagnosticosDiferenciais;
}

// ── BLOCO 3 — DESFECHO (Trombólise + Encaminhamento + assinaturas) ────────────
export interface CriteriosReperfusao {
  resolucaoSt50: boolean;
  eva3: boolean;
  arritmiaReperfusao: boolean;
}

export interface MedidasAdmissao {
  aas: boolean;
  p2y12: boolean;
  anticoagulante: boolean;
  monitorizacao: boolean;
  o2: boolean;
}

export interface PrescricoesAlta {
  aas: boolean;
  p2y12: boolean;
  estatina: boolean;
  betabloqueador: boolean;
  iecaBra: boolean;
}

export type DestinoPaciente =
  | 'alta_ambulatorial'
  | 'observacao'
  | 'internacao_uti'
  | 'transferencia_icp'
  | 'transferencia_uti_referencia'
  | 'obito'
  | '';

export interface AltaSeguraCriterios {
  heart3TropNeg: boolean;
  ecgSemIsquemia: boolean;
  semInstabilidade: boolean;
  daaTepAfastados: boolean;
  seguimentoAgendado: boolean;
  orientacoesEntregues: boolean;
}

export interface BlocoDesfecho extends ResponsavelBloco {
  // ETAPA 5 — Trombólise (VIA I)
  trombolitiseElegivel: boolean;
  trombolitiseMotivoNao: string;
  inicioFibrinolitico: string; // "HH:mm"
  tempoPortaAgulhaMin: string; // min (também derivável de horas)
  criteriosReperfusao: CriteriosReperfusao;
  eficaciaTrombolise: 'sucesso' | 'falha' | '';
  medidasAdmissao: MedidasAdmissao;
  prescricoesAlta: PrescricoesAlta;
  // ETAPA 6 — Encaminhamento final
  destino: DestinoPaciente;
  obitoData: string; // "YYYY-MM-DD"
  obitoHora: string; // "HH:mm"
  solicitacaoRegulacaoHora: string; // "HH:mm"
  confirmacaoVagaHora: string; // "HH:mm"
  saidaEfetivaHora: string; // "HH:mm"
  altaSeguraCriterios: AltaSeguraCriterios;
  // Assinaturas
  enfermeiroNomeCoren: string;
  medicoNomeCrm: string;
}

// ── Encerramento antecipado (médico) ──────────────────────────────────────────
export type MotivoEncerramento = 'nao_continuidade' | 'nao_indicacao' | '';

export interface EncerramentoProtocolo {
  motivo: MotivoEncerramento;
  observacao: string;
  /** Etapa em que o protocolo estava ao ser encerrado. */
  etapaNoEncerramento: ProtocoloStage;
  encerradoPorNome: string;
  encerradoPorRegistro: string;
  encerradoPorUserId: string | null;
  encerradoEm: string; // ISO datetime
}

/** Uma alteração de campo (par de/para) dentro de uma ação. */
export interface AlteracaoCampo {
  bloco: BlocoKey;
  campo: string; // caminho do campo, ex.: "sinaisVitais.fc"
  de: string;
  para: string;
  porUserId: string | null;
  porNome: string;
  em: string; // ISO datetime
}

/**
 * Registro de uma ação sobre uma etapa (fechamento ou edição posterior), com autor,
 * registro profissional, horário e os campos que mudaram. É o que o usuário final vê
 * de forma resumida ("X fechou", "Y alterou (N campos)").
 */
export interface RegistroAcao {
  tipo: 'fechamento' | 'edicao';
  bloco: BlocoKey;
  porNome: string;
  porRegistro: string;
  porUserId: string | null;
  em: string; // ISO datetime
  campos: { campo: string; de: string; para: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// PROTOCOLO DE SEPSE (FORM SEP) — Adulto e Pediátrico
// Etapas: abertura → pacote1h → reavaliacao → desfecho → concluido
// A variante (adulto | pediatrico) é resolvida pela idade na abertura do paciente.
// Os blocos abaixo carregam campos comuns + os específicos da variante; o backend
// apenas armazena o JSON (validação fina fica no frontend).
// ══════════════════════════════════════════════════════════════════════════════

export type SepseVariante = 'adulto' | 'pediatrico' | '';

export interface SepseFocoPrincipal {
  pulmonar: boolean;
  urinario: boolean;
  abdominal: boolean;
  peleMoles: boolean;
  snc: boolean;
  cateter: boolean;
  endocardite: boolean; // adulto
  naoDefinido: boolean;
  outro: boolean;
  outroDesc: string;
}

// ── ETAPA 1 — ABERTURA (Gatilho/Triagem + Classificação) ──────────────────────
export interface SepseBlocoAbertura extends ResponsavelBloco {
  horarioZeroData: string; // "YYYY-MM-DD"
  horarioZeroHora: string; // "HH:mm"
  focoPrincipal: SepseFocoPrincipal;
  /** adulto: 'sepse'|'choque_septico'|'infeccao_sem_disfuncao' · pediátrico: 'sepse'|'sepse_grave'|'choque_septico' */
  classificacao: string;
  // Adulto — disfunções orgânicas (ILAS) / critério de abertura
  criterioInfeccaoDisfuncao: boolean;
  criterioSirs2: boolean;
  disfuncoesOrganicas: {
    hemodinamico: boolean;
    renal: boolean;
    respiratorio: boolean;
    hematologico: boolean;
    metabolico: boolean;
    neurologico: boolean;
    hepatico: boolean;
    coagulopatia: boolean;
  };
  // Pediátrico — SIRS + sinais de hipoperfusão
  sirsPediatrica: {
    temperatura: boolean; // obrigatório (temp ou leucócitos)
    taquicardia: boolean;
    taquipneia: boolean;
    leucocitose: boolean; // obrigatório (temp ou leucócitos)
  };
  sinaisHipoperfusao: {
    tecLento: boolean; // choque frio
    perfusaoFlash: boolean; // choque quente
    alteracaoMental: boolean;
    oliguria: boolean;
    hipotensao: boolean; // sinal tardio
  };
}

// ── ETAPA 2 — PACOTE DE 1 HORA ────────────────────────────────────────────────
export interface SepseColeta {
  feito: boolean;
  hora: string; // "HH:mm"
  valor: string;
}

export interface SepseBlocoPacote1h extends ResponsavelBloco {
  // Adulto
  lactato: SepseColeta;
  hemoculturas: { feito: boolean; hora: string }; // antes do ATM
  culturasFoco: { feito: boolean; hora: string; foco: string };
  antimicrobiano: { hora1aDose: string };
  reposicaoVolemica: { indicada: boolean; naoIndicada: boolean; hora: string; mlTotal: string };
  vasopressor: { indicado: boolean; naoIndicado: boolean; hora: string; via: string; dose: string };
  // Pediátrico — 5 passos
  passo1Acesso: {
    abcde: boolean;
    o2Ofertado: boolean;
    acessoVenoso: boolean;
    acessoIO: boolean;
    ioLocal: string;
  };
  passo2Coletas: {
    lactato: SepseColeta;
    hemoculturas: { feito: boolean; hora: string };
    kitSepse: { feito: boolean; hora: string };
    glicemia: SepseColeta; // <60 corrigir
    calcioIonizado: SepseColeta;
  };
  passo3Atm: {
    doseCalculadaMg: string;
    hora1aDose: string;
    via: string; // periferico | io | central
    atmPrevio: boolean;
  };
  passo4Volume: {
    bolus1: { ml: string; hora: string; tecPos: string; estertores: boolean };
    bolus2: { ml: string; hora: string; tecPos: string; estertores: boolean };
  };
  passo5Vasoativo: {
    tipoChoque: string; // frio | quente
    droga: string; // adrenalina | noradrenalina
    doseInicial: string;
    hora: string;
    via: string;
  };
}

// ── ETAPA 3 — REAVALIAÇÃO (adulto 6h · pediátrico Phoenix + 1–2h) ──────────────
export interface SepseMetaReav {
  valor: string;
  metaAtingida: string; // 'sim' | 'nao' | ''
}

export interface SepseBlocoReavaliacao extends ResponsavelBloco {
  // Adulto — reavaliação 6h
  reav6h: {
    pam: SepseMetaReav;
    tec: SepseMetaReav;
    diurese: SepseMetaReav;
    spo2: SepseMetaReav;
    consciencia: SepseMetaReav;
    glicemia: SepseMetaReav;
  };
  // Pediátrico — Phoenix Sepsis Score 2024
  phoenix: {
    respiratorio: number; // 0–3
    cardiovascularVasoativo: number; // 0–2
    cardiovascularLactato: number; // 0–2
    coagulacao: number; // 0–2
    neurologico: number; // 0–2
    total: number;
    classificacao: string; // 'sepse' | 'choque_septico' | 'incompleto'
  };
  reav1a2h: {
    tec: SepseMetaReav;
    diurese: SepseMetaReav;
    pas: SepseMetaReav;
    consciencia: SepseMetaReav;
    spo2: SepseMetaReav;
  };
  recoletaLactato: { hora: string; valor: string; clareamento: string };
}

// ── ETAPA 4 — DESFECHO (Transferência UTI + Encerramento do protocolo) ─────────
export interface SepseBlocoDesfecho extends ResponsavelBloco {
  criteriosTransferencia: {
    choqueVasopressor: boolean;
    lactatoSemClareamento: boolean;
    vniVm: boolean;
    duasDisfuncoes: boolean;
    deterioracao: boolean;
    alteracaoNeuro: boolean;
    glasgowBaixo: boolean; // pediátrico ≤11
    phoenix2: boolean; // pediátrico
  };
  utiAcionadaHora: string;
  vagaStatus: string; // 'confirmada' | 'aguardando' | 'na'
  encerramentoTipo: string; // 'sepse_confirmada' | 'dx_alternativo' | 'infeccao_sem_disfuncao' | 'fim_de_vida' | 'transferencia'
  dxAlternativoDesc: string;
  dataHoraEncerramentoData: string;
  dataHoraEncerramentoHora: string;
  desfecho: string; // 'alta' | 'obito' | 'transferencia' | 'evento_sentinela'
}

// ══════════════════════════════════════════════════════════════════════════════
// PROTOCOLO DE AVC (FORM-AVC-001) — Linha de Cuidado do AVC (Rede Mediall Brasil)
// Etapas: abertura → avaliacao → imagem → trombolise → monitorizacao → desfecho → concluido
// Marco zero dos tempos críticos = FMC (primeiro contato), capturado na abertura.
// Os blocos abaixo são armazenados como JSON (blocos[stageKey]); a validação fina
// vive no frontend, com checagens mínimas em protocolo-definitions.ts.
// Mantido em sincronia manual com o frontend (src/types/index.ts).
// ══════════════════════════════════════════════════════════════════════════════

// ── ETAPA 1 — ABERTURA (Critérios + Marcos temporais + Triagem/Classificação) ──
export interface AvcMotivoAbertura {
  deficitFocalAgudo: boolean;
  fastPositivo: boolean;
  cincinnatiPositiva: boolean;
  cefaleiaSubita: boolean; // thunderclap
  alteracaoConsciencia: boolean;
  suspeitaClinica: boolean; // decisão médica
  wakeUpStroke: boolean; // sintomas ao acordar
  outro: boolean;
  outroDesc: string;
}

export interface AvcProfissionaisAcionados {
  medico: boolean;
  enfermagem: boolean;
  laboratorio: boolean;
  imagem: boolean;
  neuroTelemedicina: boolean;
  regulacao: boolean;
}

export interface AvcBlocoAbertura extends ResponsavelBloco {
  motivoAbertura: AvcMotivoAbertura;
  // Marcos temporais (FMC = marco zero dos tempos críticos)
  fmcHora: string; // "HH:mm" — marco zero
  inicioSintomasHora: string; // "HH:mm"
  lkwHora: string; // "HH:mm" — último momento visto bem
  tempoDesdeLkw: string; // texto livre "Xh Ymin"
  lkwResponsavelInfo: string;
  incertezaHorario: boolean;
  // Triagem e classificação de risco
  inicioTriagemHora: string; // "HH:mm"
  ativacaoCodigoAvcHora: string; // "HH:mm"
  classificacaoManchester: 'vermelho' | 'laranja' | 'outro' | '';
  manchesterOutroDesc: string;
  profissionaisAcionados: AvcProfissionaisAcionados;
  preNotificacao: 'sim' | 'nao' | 'na' | '';
  preNotificacaoHora: string; // "HH:mm"
}

// ── ETAPA 2 — AVALIAÇÃO INICIAL (FAST/Cincinnati + Sinais vitais + NIHSS) ──────
export type AvcFastItem = 'normal' | 'alterado' | '';

export interface AvcCondutasIniciais {
  acessoVenoso: boolean;
  coletaExames: boolean;
  ecgRealizado: boolean; // sem atrasar trombólise
  o2SeSpo2Baixo: boolean; // O2 apenas se SpO2 < 94%
}

export interface AvcBlocoAvaliacao extends ResponsavelBloco {
  // FAST / Cincinnati
  face: AvcFastItem;
  braco: AvcFastItem;
  fala: AvcFastItem;
  tempoRegistrado: boolean; // início/LKW registrado
  // Sinais vitais e dados clínicos
  paInicial: string; // "120/80"
  fc: string; // bpm
  fr: string; // ipm
  spo2: string; // %
  temperatura: string; // °C
  glicemiaCapilar: string; // mg/dL
  pesoKg: string; // aferido/estimado
  glasgow: string; // 3–15
  nihssInicial: string; // 0–42
  anticoagulante: {
    uso: boolean;
    qual: string;
    ultimaDoseData: string; // "YYYY-MM-DD"
    ultimaDoseHora: string; // "HH:mm"
  };
  condutasIniciais: AvcCondutasIniciais;
}

// ── ETAPA 3 — IMAGEM / FLUXO ASSISTENCIAL (A: com TC · B: sem TC) ──────────────
export type AvcResultadoTc =
  | 'sem_hemorragia'
  | 'hemorragia_intraparenquimatosa'
  | 'hemorragia_subaracnoidea'
  | 'sinais_precoces_isquemia'
  | 'tc_normal'
  | '';

export interface AvcBlocoImagem extends ResponsavelBloco {
  fluxo: 'a' | 'b' | '';
  // Fluxo A — unidade com tomografia
  tcSolicitacaoHora: string; // "HH:mm"
  tcInicioHora: string; // "HH:mm"
  tcLaudoHora: string; // "HH:mm"
  aspects: string; // 0–10
  resultadoTc: AvcResultadoTc;
  angioTcRealizada: boolean;
  lvoSuspeita: boolean; // oclusão de grande vaso
  condutaAposImagem: string;
  // Fluxo B — unidade sem tomografia (telestroke + regulação)
  teleconsultaRealizada: boolean;
  teleconsultaHora: string; // "HH:mm"
  neurologistaConsultado: string;
  recomendacaoTeleconsulta: string;
  regulacaoAcionada: boolean;
  regulacaoHora: string; // "HH:mm"
  unidadeDestino: string;
  aceiteVagaHora: string; // "HH:mm"
  saidaUnidadeHora: string; // "HH:mm"
  didoMin: string; // door-in/door-out (min)
  condicoesTransferencia: string;
}

// ── ETAPA 4 — TROMBÓLISE (Elegibilidade + Administração da Alteplase) ──────────
export interface AvcCriteriosInclusao {
  deficitIncapacitante: boolean;
  dxCompativel: boolean; // AVC isquêmico
  tcSemHemorragia: boolean;
  lkwNaJanela: boolean;
  idade18: boolean; // ≥ 18 anos
  glicemia60a400: boolean;
  paControlada: boolean; // ≤ 185/110
  outro: boolean;
  outroDesc: string;
}

export interface AvcContraindicacoes {
  hemorragiaIntracraniana: boolean;
  tceAvcPrevio3m: boolean;
  cirurgiaIntracraniana3m: boolean;
  neoplasiaMav: boolean;
  sangramentoAtivo: boolean;
  varfarinaInr: boolean; // INR > 1,7
  plaquetas: boolean; // < 100.000
  glicemiaBaixa: boolean; // < 60 não corrigida
  paPersistente: boolean; // > 185/110 apesar de tratamento
  endocardite: boolean;
  dissecaoAorta: boolean;
  outro: boolean;
  outroDesc: string;
}

export interface AvcBlocoTrombolise extends ResponsavelBloco {
  criteriosInclusao: AvcCriteriosInclusao;
  contraindicacoes: AvcContraindicacoes;
  // Decisão médica
  tromboliseIndicada: boolean;
  motivoNaoTrombolise: string;
  discussaoNeurologista: boolean;
  neurologistaNome: string;
  consentimentoFamiliar: 'sim' | 'nao' | 'na' | '';
  // Administração da Alteplase (0,9 mg/kg, máx 90; 10% bolus + 90% infusão de 1h)
  pesoCalculo: string; // kg
  doseTotal: string; // mg (auto: 0,9 × peso, máx 90)
  doseBolus: string; // mg (auto: 10%)
  doseInfusao: string; // mg (auto: 90%)
  bolusHora: string; // "HH:mm"
  infusaoInicioHora: string; // "HH:mm"
  infusaoTerminoHora: string; // "HH:mm"
  doubleCheck: boolean;
  intercorrencias: string;
  paDuranteApos: string;
}

// ── ETAPA 5 — MONITORIZAÇÃO PÓS-TROMBÓLISE / PÓS-AVC ──────────────────────────
export interface AvcMonitorLinha {
  hora: string; // "HH:mm"
  nihss: string;
  pa: string; // "120/80"
  glicemia: string;
  temp: string;
}

export interface AvcFeSS {
  degluticao24h: boolean; // avaliação de deglutição em até 24h
  fessFebre: boolean; // FeSS — febre controlada
  fessGlicemia: boolean; // FeSS — glicemia controlada
  fessDegluticao: boolean; // FeSS — deglutição avaliada antes de dieta VO
  fisioterapia: boolean;
  fonoaudiologia: boolean;
  profilaxiaTvp: boolean;
  antiagregacao: boolean; // conforme diagnóstico/tempo pós-trombólise
}

export interface AvcBlocoMonitorizacao extends ResponsavelBloco {
  serie: AvcMonitorLinha[]; // monitorização seriada (NIHSS/PA/glicemia/temp)
  deterioracaoNeurologica: boolean;
  suspeitaSangramento: boolean;
  tcControleRealizada: boolean;
  tcControleHora: string; // "HH:mm"
  condutaComplicacoes: string;
  fess: AvcFeSS;
}

// ── ETAPA 6 — DESFECHO (Encerramento do protocolo) ────────────────────────────
export type AvcDiagnosticoFinal =
  | 'avc_isquemico'
  | 'avc_hemorragico'
  | 'ait'
  | 'mimics'
  | 'outro'
  | '';

export type AvcDestino =
  | 'alta'
  | 'internacao_enfermaria'
  | 'uti'
  | 'transferencia'
  | 'obito'
  | '';

export interface AvcTratamentoRealizado {
  trombolise: boolean;
  transferenciaTrombectomia: boolean;
  tratamentoClinico: boolean;
  neurocirurgia: boolean; // neurocirurgia/transferência
}

export interface AvcBlocoDesfecho extends ResponsavelBloco {
  diagnosticoFinal: AvcDiagnosticoFinal;
  diagnosticoOutroDesc: string;
  tratamentoRealizado: AvcTratamentoRealizado;
  destino: AvcDestino;
  nihssAlta: string; // 0–42
  mrsAlta: string; // 0–6 (modified Rankin)
  antiagregacaoAlta: 'sim' | 'nao' | 'na' | '';
  encaminhamentoAmbulatorial: string;
  consultaNeuro30d: boolean; // consulta neurológica em até 30 dias
  consultaNeuroData: string; // "YYYY-MM-DD"
}
