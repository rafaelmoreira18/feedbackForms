import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AuditAction =
  | 'FORM_CREATED'
  | 'FORM_DELETED'
  | 'FORM_BULK_DELETED'
  | 'FORM_CPF_UPDATED'
  | 'TRAINING_SESSION_CREATED'
  | 'TRAINING_SESSION_UPDATED'
  | 'TRAINING_SESSION_DELETED'
  | 'TRAINING_RESPONSE_CREATED'
  | 'TRAINING_RESPONSE_DELETED';

/**
 * Trilha de auditoria — registra quem fez o que, em qual registro, quando e de qual IP.
 * Imutavel: nenhum UPDATE ou DELETE deve ser feito nesta tabela.
 */
@Index(['tenantId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tenant ao qual o registro auditado pertence */
  @Index()
  @Column()
  tenantId: string;

  /** ID do usuario que executou a acao (null para acoes publicas como submissao de formulario) */
  @Index()
  @Column({ type: 'varchar', nullable: true, default: null })
  userId: string | null;

  /** Email do usuario no momento da acao (desnormalizado para facilitar leitura de relatorios) */
  @Column({ type: 'varchar', nullable: true, default: null })
  userEmail: string | null;

  /** Acao realizada */
  @Column()
  action: AuditAction;

  /** Tipo da entidade afetada (ex: "form3_response", "training_session") */
  @Column()
  entityType: string;

  /** ID da entidade afetada */
  @Column({ type: 'varchar', nullable: true, default: null })
  entityId: string | null;

  /** IP de origem da requisicao */
  @Column({ type: 'varchar', nullable: true, default: null })
  ipAddress: string | null;

  /** Detalhes adicionais da acao em formato livre (ex: campos alterados, motivo) */
  @Column({ type: 'jsonb', nullable: true, default: null })
  details: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
