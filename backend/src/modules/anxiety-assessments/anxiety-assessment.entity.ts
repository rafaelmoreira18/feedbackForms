import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';

/** Instrumentos psicométricos suportados nesta aplicação. */
export type AnxietyInstrument = 'bai' | 'gad7';

/** Classificação de gravidade derivada do escore total. */
export type AnxietyClassification = 'minima' | 'leve' | 'moderada' | 'grave';

/** Resposta de um item — value de 0 a 3 (escala Likert dos dois instrumentos). */
export interface AnxietyAnswer {
  /** índice do item: 1..21 (BAI) ou 1..7 (GAD-7) */
  itemId: number;
  /** 0..3 */
  value: number;
}

/**
 * Avaliação de Ansiedade — uma aplicação por colaborador + data.
 * Cada registro carrega OS DOIS instrumentos (BAI e GAD-7), criados juntos.
 * O colaborador responde via link público; o RH vê os escores/classificação.
 */
@Index(['tenantId', 'createdAt'])
@Entity('anxiety_assessments')
export class AnxietyAssessmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** Usuário de RH que criou a aplicação — usado para "cada admin vê a sua". */
  @Index()
  @Column({ type: 'uuid', nullable: true, default: null })
  createdByUserId: string | null;

  /** URL-safe slug, único por tenant — e.g. "joao-silva-20260623" */
  @Index()
  @Column()
  slug: string;

  // ── Cabeçalho (por colaborador) ──────────────────────────────────────────────
  @Column()
  colaboradorNome: string;

  @Column({ default: '' })
  cargo: string;

  @Column({ default: '' })
  setor: string;

  /** ISO date string: "2026-06-23" */
  @Column({ default: '' })
  dataAplicacao: string;

  // ── BAI (Inventário de Ansiedade de Beck) — 21 itens, escore 0..63 ───────────
  @Column({ type: 'jsonb', nullable: true, default: null })
  baiRespostas: AnxietyAnswer[] | null;

  @Column({ type: 'int', nullable: true, default: null })
  baiEscore: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true, default: null })
  baiClassificacao: AnxietyClassification | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  baiRespondidoEm: Date | null;

  // ── GAD-7 (Transtorno de Ansiedade Generalizada) — 7 itens, escore 0..21 ─────
  @Column({ type: 'jsonb', nullable: true, default: null })
  gad7Respostas: AnxietyAnswer[] | null;

  @Column({ type: 'int', nullable: true, default: null })
  gad7Escore: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true, default: null })
  gad7Classificacao: AnxietyClassification | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  gad7RespondidoEm: Date | null;

  /** Quando false o link público fica inativo. */
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
