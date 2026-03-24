import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export type UserRole = 'holding_admin' | 'hospital_admin' | 'viewer';

/**
 * @deprecated — users table was removed from feedbackforms.
 * Authentication is now delegated to Multi_UnidadesDB.
 * This file is kept only for seed scripts that have not been updated yet.
 */
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

  @Column({ default: 'viewer' })
  role: UserRole;

  @Index()
  @Column({ nullable: true })
  tenantId: string | null;
}

export type User = UserEntity;
