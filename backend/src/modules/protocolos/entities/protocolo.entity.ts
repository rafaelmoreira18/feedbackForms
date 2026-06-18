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
import type {
  ProtocoloStage,
  BlocoTriagem,
  BlocoEcg,
  BlocoInvestigacao,
  BlocoDesfecho,
  EncerramentoProtocolo,
  AlteracaoCampo,
  RegistroAcao,
} from '../protocolo-types';

// Re-exporta os tipos de domínio para os importadores existentes da entity.
export * from '../protocolo-types';

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

  /** Sepse pediátrica: peso em kg (cálculo de doses). Vazio nos demais. */
  @Column({ default: '' })
  pesoKg: string;

  /** Sepse: variante do protocolo resolvida pela idade ('adulto' | 'pediatrico'). Vazio nos demais. */
  @Column({ type: 'varchar', length: 12, default: '' })
  variante: string;

  // ── Estado / blocos ───────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'triagem' })
  currentStage: ProtocoloStage;

  /**
   * Armazenamento genérico dos blocos por etapa — `{ [stageKey]: BlocoData }`.
   * É a fonte de verdade para TODOS os tipos de protocolo. As colunas nomeadas
   * abaixo (triagem/ecg/...) são legado de Dor Torácica, mantidas como rede de
   * segurança após o backfill; o código novo lê/escreve apenas `blocos`/`rascunhos`.
   */
  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'" })
  blocos: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'" })
  rascunhos: Record<string, unknown>;

  // ── Colunas legado (Dor Torácica) — preservadas, não usadas pelo código novo ──
  @Column({ type: 'jsonb', nullable: true, default: null })
  triagem: BlocoTriagem | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  ecg: BlocoEcg | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  investigacao: BlocoInvestigacao | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  desfecho: BlocoDesfecho | null;

  // ── Rascunhos (stand-by) — estado parcial salvo sem fechar a etapa ──────────
  @Column({ type: 'jsonb', nullable: true, default: null })
  triagemRascunho: Partial<BlocoTriagem> | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  ecgRascunho: Partial<BlocoEcg> | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  investigacaoRascunho: Partial<BlocoInvestigacao> | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  desfechoRascunho: Partial<BlocoDesfecho> | null;

  // ── Encerramento antecipado pelo médico + histórico de alterações ───────────
  @Column({ type: 'jsonb', nullable: true, default: null })
  encerramento: EncerramentoProtocolo | null;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
  historicoAlteracoes: AlteracaoCampo[];

  /** Histórico por ação (fechamento/edição) — base do resumo mostrado ao usuário. */
  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
  historicoAcoes: RegistroAcao[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
