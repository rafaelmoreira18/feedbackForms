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
 * pendente               — PDI criado; aguardando o gestor preencher as ações
 * aguardando_colaborador — gestor preencheu; aguardando a validação do colaborador
 * concluida              — colaborador validou; PDI disponível para PDF
 */
export type PdiStatus = 'pendente' | 'aguardando_colaborador' | 'concluida';

/** Responsabilidade de cada ação de desenvolvimento (planilha: "Colaborador ou Empresa"). */
export type PdiResponsabilidade = 'colaborador' | 'empresa';

/** Uma linha da tabela de ações do PDI. */
export interface PdiAction {
  /** Ação a ser realizada (curso, formação, palestra, livro, filme, reunião de acompanhamento) */
  acao: string;
  /** Responsável pela ação */
  responsabilidade: PdiResponsabilidade;
  /** id da competência vinculada (ver competencies.ts no frontend) */
  competenciaId: string;
  /** ISO date string: "2026-08-30" */
  prazo: string;
}

/**
 * Plano de Desenvolvimento Individual (PDI) — gerado pelo RH a partir de uma
 * avaliação de desempenho concluída (1 PDI por avaliação). Fluxo: gestor preenche
 * as ações + feedback final, depois o colaborador valida (nome + comentário opcional).
 */
@Index(['tenantId', 'createdAt'])
@Entity('performance_development_plans')
export class PerformanceDevelopmentPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** Usuário de RH que criou o PDI — usado para "cada admin vê o seu" */
  @Index()
  @Column({ type: 'uuid', nullable: true, default: null })
  createdByUserId: string | null;

  /** URL-safe slug, único por tenant — e.g. "joao-silva-20260528-pdi" */
  @Index()
  @Column()
  slug: string;

  // ── Vínculo com a avaliação de origem ───────────────────────────────────────
  @Index()
  @Column({ type: 'uuid' })
  evaluationId: string;

  @Column()
  evaluationSlug: string;

  // ── Cabeçalho (desnormalizado da avaliação) ─────────────────────────────────
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

  // ── Conteúdo do PDI ─────────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 32, default: 'pendente' })
  status: PdiStatus;

  /** Ações de desenvolvimento — null até o gestor preencher */
  @Column({ type: 'jsonb', nullable: true, default: null })
  actions: PdiAction[] | null;

  /** Feedback final do gestor — null até o gestor preencher */
  @Column({ type: 'text', nullable: true, default: null })
  managerFeedback: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  managerSubmittedAt: Date | null;

  // ── Validação do colaborador ────────────────────────────────────────────────
  /** Nome completo informado pelo colaborador ao validar */
  @Column({ type: 'varchar', nullable: true, default: null })
  colaboradorNomeValidacao: string | null;

  /** Comentário opcional do colaborador */
  @Column({ type: 'text', nullable: true, default: null })
  colaboradorComentario: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  colaboradorSubmittedAt: Date | null;

  /** Quando false o link público fica inativo */
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
