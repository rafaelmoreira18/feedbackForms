import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenants/tenant.entity';

/**
 * Etapa/bloco corrente do protocolo. O preenchimento é sequencial e cada bloco,
 * ao ser fechado, libera o próximo. Só o fechamento de `desfecho` conclui o protocolo.
 *
 *   triagem      — aberto; aguardando o bloco Triagem (cabeçalho + ETAPA 1 + ETAPA 2 ECG)
 *   investigacao — Triagem fechada; aguardando Investigação (ETAPA 3 + HEART + Dx diferenciais)
 *   desfecho     — Investigação fechada; aguardando Desfecho (ETAPA 5 + ETAPA 6 + assinaturas)
 *   concluido    — Desfecho fechado; protocolo encerrado
 */
export type ProtocoloStage = 'triagem' | 'investigacao' | 'desfecho' | 'concluido';

/** Profissional que fechou um bloco (nome + nº de cadastro profissional: CRM/COREN/etc.) */
export interface ResponsavelBloco {
  responsavelNome: string;
  registroProfissional: string;
  /** ISO datetime do fechamento do bloco */
  fechadoEm: string;
}

// ── BLOCO 1 — TRIAGEM (ETAPA 1 Triagem + ETAPA 2 ECG) ─────────────────────────
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
  // ETAPA 1 — Triagem
  inicioTriagem: string; // "HH:mm"
  classificacaoManchester: 'vermelho' | 'laranja' | '';
  sinaisVitais: SinaisVitais;
  queixaPrincipal: QueixaPrincipal;
  inicioSintomasData: string; // "YYYY-MM-DD"
  inicioSintomasHora: string; // "HH:mm"
  alergias: boolean;
  alergiasDescricao: string;
  instabilidade: boolean; // se SIM → Sala Vermelha
  // ETAPA 2 — ECG
  primeiroEcgHora: string; // "HH:mm"
  interpretacaoMedicaHora: string; // "HH:mm"
  resultadoEcg: ResultadoEcg;
  derivacoesExtras: DerivacoesExtras;
}

// ── BLOCO 2 — INVESTIGAÇÃO (Troponina + HEART + Dx diferenciais) ──────────────
export interface ColetaTroponina {
  horaColeta: string; // "HH:mm"
  resultado: string; // ng/mL
  horaResultadoLab: string; // "HH:mm"
}

export type FaixaRiscoHeart = 'baixo' | 'intermediario' | 'alto' | '';

export interface DiagnosticosDiferenciais {
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

@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'currentStage'])
@Entity('protocolos')
export class ProtocoloEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** Tipo de protocolo — preparado para futuros protocolos sem migração de schema */
  @Column({ type: 'varchar', length: 40, default: 'dor_toracica' })
  protocolType: string;

  /** URL-safe slug, único por tenant — e.g. "joao-silva-20260531-a1b2" */
  @Index()
  @Column()
  slug: string;

  /** Usuário que abriu o protocolo (iniciou o paciente) */
  @Index()
  @Column({ type: 'uuid', nullable: true, default: null })
  createdByUserId: string | null;

  // ── Cabeçalho do paciente ─────────────────────────────────────────────────
  @Column()
  pacienteNome: string;

  @Column({ default: '' })
  numeroProntuario: string;

  @Column({ default: '' })
  dataNascimento: string; // "YYYY-MM-DD"

  @Column({ default: '' })
  idade: string;

  @Column({ type: 'varchar', length: 1, default: '' })
  sexo: string; // 'M' | 'F'

  @Column({ default: '' })
  dataAtendimento: string; // "YYYY-MM-DD" (data-âncora dos marcos de tempo)

  @Column({ default: '' })
  horaChegada: string; // "HH:mm" (senha / FMC)

  // ── Estado / blocos ───────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'triagem' })
  currentStage: ProtocoloStage;

  @Column({ type: 'jsonb', nullable: true, default: null })
  triagem: BlocoTriagem | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  investigacao: BlocoInvestigacao | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  desfecho: BlocoDesfecho | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
