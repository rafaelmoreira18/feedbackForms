import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';

export type UserRole = 'holding_admin' | 'hospital_admin' | 'viewer';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  /**
   * holding_admin — sees all tenants, no tenantId needed
   * hospital_admin — scoped to a single tenant
   * viewer         — read-only, scoped to a single tenant
   */
  @Column({ default: 'viewer' })
  role: UserRole;

  /**
   * null for holding_admin (cross-tenant access)
   * set for hospital_admin and viewer
   */
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity | null;
}

export type User = UserEntity;
