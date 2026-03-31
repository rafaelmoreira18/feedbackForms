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

export type TrainingType = 'eficacia' | 'reacao';

@Index(['tenantId', 'createdAt'])
@Entity('training_sessions')
export class TrainingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** URL-safe slug, unique per tenant — e.g. "integracao-novos-2026-03" */
  @Index()
  @Column()
  slug: string;

  /** Display title: "Integração Novos Colaboradores" */
  @Column()
  title: string;

  /** ISO date string: "2026-03-24" */
  @Column()
  trainingDate: string;

  /** eficacia | reacao */
  @Column({ type: 'varchar', length: 16 })
  trainingType: TrainingType;

  @Column()
  instructor: string;

  /** When false the survey link is inactive */
  @Column({ default: true })
  active: boolean;

  /**
   * For eficácia sessions: references the reação session they were created from.
   * Null for reação sessions and legacy standalone eficácia sessions.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true, default: null })
  linkedSessionId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
