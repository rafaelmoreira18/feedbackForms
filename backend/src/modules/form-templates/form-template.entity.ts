import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
// ManyToOne/JoinColumn used by FormTemplateBlockEntity and FormQuestionEntity below

// ─── Sub-reason stored inline in the question row ─────────────────────────────

export type QuestionScale = 'rating4' | 'nps';

// ─── FormTemplate ──────────────────────────────────────────────────────────────

@Entity('form_templates')
@Index(['tenantId', 'slug'], { unique: true })
export class FormTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * References the tenant UUID from the main DB.
   * No FK constraint — cross-database FKs are not supported in PostgreSQL.
   * Tenant isolation is enforced at the application layer via middleware.
   */
  @Index()
  @Column()
  tenantId: string;

  /** e.g. "internacao", "uti" — unique per tenant */
  @Column()
  slug: string;

  /** Display name: "Internação Hospitalar" */
  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => FormTemplateBlockEntity, (b) => b.template, {
    cascade: true,
    eager: true,
  })
  blocks: FormTemplateBlockEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── FormTemplateBlock ─────────────────────────────────────────────────────────

@Entity('form_template_blocks')
export class FormTemplateBlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FormTemplateEntity, (t) => t.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: FormTemplateEntity;

  @Index()
  @Column()
  templateId: string;

  @Column()
  title: string;

  @Column({ type: 'int' })
  order: number;

  @OneToMany(() => FormQuestionEntity, (q) => q.block, { cascade: true, eager: true })
  questions: FormQuestionEntity[];
}

// ─── FormQuestion ──────────────────────────────────────────────────────────────

@Entity('form_questions')
export class FormQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FormTemplateBlockEntity, (b) => b.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockId' })
  block: FormTemplateBlockEntity;

  @Index()
  @Column()
  blockId: string;

  /** Stable logical ID within the form: "q1", "q2", "nps" */
  @Column()
  questionKey: string;

  @Column('text')
  text: string;

  @Column({ type: 'varchar', length: 16 })
  scale: QuestionScale;

  /** [reason1, reason2, reason3] — null for NPS questions */
  @Column({ type: 'jsonb', nullable: true })
  subReasons: [string, string, string] | null;

  @Column({ type: 'int' })
  order: number;
}
