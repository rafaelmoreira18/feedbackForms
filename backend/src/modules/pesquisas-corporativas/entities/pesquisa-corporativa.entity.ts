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
export type PesquisaVisibility = 'global' | 'especifica' | 'privada';

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

  /** Categoria/pasta livre: "Treinamento", "Clima Organizacional", etc. Inserida via banco. */
  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  categoria: string | null;

  /** Controla quem pode ver esta pesquisa: 'global' | 'especifica' | 'privada' */
  @Column({ type: 'varchar', length: 20, default: 'global' })
  visibility: PesquisaVisibility;

  /** Preenchido quando visibility = 'especifica'. Lista de tenantIds autorizados. */
  @Column({ type: 'uuid', array: true, nullable: true, default: null })
  allowedTenantIds: string[] | null;

  /**
   * Quando false, a pesquisa existe no tenant mas o rh_admin da unidade não a vê no hub.
   * O link público continua funcional. Usado para pesquisas geridas pela sede.
   */
  @Column({ default: true })
  visivelParaUnidade: boolean;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizadoEm' })
  atualizadoEm: Date;
}
