import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PesquisaCorporativaEntity } from './pesquisa-corporativa.entity';

export interface PesquisaAnswer {
  perguntaId: string;
  valor: number | string | boolean | string[];
}

@Index(['tenantId', 'pesquisaId', 'criadoEm'])
@Entity('pesquisas_respostas')
export class PesquisaRespostaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  tenantId: string;

  @Index()
  @Column({ type: 'uuid' })
  pesquisaId: string;

  @ManyToOne(() => PesquisaCorporativaEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pesquisaId' })
  pesquisa: PesquisaCorporativaEntity;

  @Column({ default: 'Anônimo' })
  nomeRespondente: string;

  /** Campos variáveis por tipo de pesquisa: { tempoDeEmpresa, cargo, unidade, ... } */
  @Column({ type: 'jsonb', default: {} })
  metadados: Record<string, unknown>;

  /** Array de respostas: [{ perguntaId, valor }] */
  @Column({ type: 'jsonb' })
  answers: PesquisaAnswer[];

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;
}
