import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from './training-session.entity';

export interface TrainingAnswer {
  questionId: string;
  value: number;
}

@Index(['tenantId', 'sessionId', 'createdAt'])
@Entity('training_responses')
export class TrainingResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Index()
  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => TrainingSessionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSessionEntity;

  /** Respondent (collaborator) name — not required to be unique */
  @Column({ default: 'Anônimo' })
  respondentName: string;

  /** Array of { questionId, value } */
  @Column({ type: 'jsonb' })
  answers: TrainingAnswer[];

  /** Avaliação de Reação — ponto alto */
  @Column({ default: '' })
  pontoAlto: string;

  /** Avaliação de Reação — o que já aplica */
  @Column({ default: '' })
  jaAplica: string;

  /** Avaliação de Reação — recomenda? null = not answered */
  @Column({ type: 'boolean', nullable: true })
  recomenda: boolean | null;

  /** Avaliação de Reação — por quê recomenda/não */
  @Column({ default: '' })
  recomendaMotivo: string;

  @Column({ default: '' })
  comments: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
