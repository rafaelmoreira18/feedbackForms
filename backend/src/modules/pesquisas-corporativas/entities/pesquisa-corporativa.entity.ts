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

export type PesquisaTipo = 'clima' | 'engajamento' | 'saida' | string;

export interface PesquisaBloco {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  perguntas: PesquisaPergunta[];
}

export interface PesquisaPergunta {
  id: string;
  texto: string;
  escala: 'likert5' | 'likert3' | 'nps' | 'aberta' | 'opcoes' | 'multipla' | 'booleano';
  opcoes?: string[];
  obrigatoria: boolean;
  ordem: number;
}

@Index(['tenantId', 'slug'], { unique: true })
@Index(['tenantId', 'criadoEm'])
@Entity('pesquisas_corporativas')
export class PesquisaCorporativaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true, default: null })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity | null;

  @Column()
  titulo: string;

  @Column()
  slug: string;

  @Column({ type: 'varchar', length: 32 })
  tipo: string;

  /** Estrutura completa da pesquisa: blocos + perguntas */
  @Column({ type: 'jsonb' })
  blocos: PesquisaBloco[];

  @Column({ default: true })
  ativa: boolean;

  /** Período livre: "2026-S1", "2026-Q2", "Anual 2026", etc. */
  @Column({ type: 'varchar', nullable: true, default: null })
  periodo: string | null;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizadoEm' })
  atualizadoEm: Date;
}
