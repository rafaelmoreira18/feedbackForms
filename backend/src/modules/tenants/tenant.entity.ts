import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** URL-safe identifier: "hospital-sao-lucas", "hospital-norte" */
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
