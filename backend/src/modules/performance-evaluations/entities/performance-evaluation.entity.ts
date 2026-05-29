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
import { TenantEntity } from '../../tenants/tenant.entity';

/**
 * pendente               — criada; aguardando a avaliação do gestor
 * aguardando_colaborador — gestor respondeu; aguardando a autoavaliação do colaborador
 * concluida              — ambos responderam; relatório (radar) disponível
 */
export type PerformanceEvaluationStatus =
  | 'pendente'
  | 'aguardando_colaborador'
  | 'concluida';

export interface PerformanceAnswer {
  /** id da competência (ver competencies.ts no frontend) */
  competenciaId: string;
  /** nota de 0 a 10 */
  valor: number;
  /** justificativa opcional */
  justificativa: string;
}

@Index(['tenantId', 'createdAt'])
@Entity('performance_evaluations')
export class PerformanceEvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** Usuário de RH que criou a avaliação — usado para "cada admin vê a sua" */
  @Index()
  @Column({ type: 'uuid', nullable: true, default: null })
  createdByUserId: string | null;

  /** URL-safe slug, único por tenant — e.g. "joao-silva-20260528" */
  @Index()
  @Column()
  slug: string;

  // ── Cabeçalho ───────────────────────────────────────────────────────────────
  @Column()
  colaboradorNome: string;

  @Column({ default: '' })
  setor: string;

  @Column({ default: '' })
  cargo: string;

  @Column({ default: '' })
  gestorArea: string;

  @Column({ default: '' })
  projeto: string;

  @Column({ default: '' })
  avaliador: string;

  /** ISO date string: "2026-05-28" */
  @Column({ default: '' })
  dataAvaliacao: string;

  // ── Respostas ────────────────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 32, default: 'pendente' })
  status: PerformanceEvaluationStatus;

  /** Notas do gestor — null até o gestor responder */
  @Column({ type: 'jsonb', nullable: true, default: null })
  managerAnswers: PerformanceAnswer[] | null;

  /** Autoavaliação do colaborador — null até o colaborador responder */
  @Column({ type: 'jsonb', nullable: true, default: null })
  selfAnswers: PerformanceAnswer[] | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  managerSubmittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  selfSubmittedAt: Date | null;

  /** Quando false o link público fica inativo */
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
