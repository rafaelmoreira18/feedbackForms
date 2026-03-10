import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';

export interface Form3Answer {
  questionId: string;
  value: number;
  reasons?: string[];
  note?: string;
}

@Index(['tenantId', 'formType', 'createdAt'])
@Entity('form3_responses')
export class Form3ResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Row-level tenant isolation */
  @Index()
  @Column()
  tenantId: string;

  @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  /** Matches FormTemplateEntity.slug for this tenant (e.g. "internacao", "uti") */
  @Index()
  @Column()
  formType: string;

  @Column()
  patientName: string;

  @Column({ length: 11 })
  patientCpf: string;

  @Column()
  patientAge: number;

  @Column()
  patientGender: string;

  @Column()
  admissionDate: string;

  @Column()
  dischargeDate: string;

  @Column()
  evaluatedDepartment: string;

  @Column({ type: 'jsonb' })
  answers: Form3Answer[];

  @Column({ default: '' })
  comments: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  /** Soft-delete timestamp. null = active. Set via softDelete(), excluded from all queries automatically. */
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}

export type Form3Response = Form3ResponseEntity;
