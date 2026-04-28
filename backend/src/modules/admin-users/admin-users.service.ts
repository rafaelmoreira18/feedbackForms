import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { AUTH_DB_POOL } from '../auth-db/auth-db.module';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

export interface AdminUserRow {
  id: string;
  email: string;
  username: string | null;
  nome: string;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantNome: string | null;
  ativo: boolean;
  mustChangePassword: boolean;
  criadoEm: string;
}

// Only users that belong to this system (feedbackforms)
const SYSTEM_KEY = 'feedbackforms';

// Roles that belong to this system
const SYSTEM_ROLES = ['operator_forms', 'tenant_admin', 'super_admin'];

@Injectable()
export class AdminUsersService {
  constructor(@Inject(AUTH_DB_POOL) private readonly pool: Pool) {}

  async findByTenant(tenantId: string): Promise<AdminUserRow[]> {
    const result = await this.pool.query<AdminUserRow>(
      `SELECT u.id, u.email, u.username, u.nome, u.role, u."tenantId", u.ativo, u."mustChangePassword", u."criadoEm",
              t.slug AS "tenantSlug", t.nome AS "tenantNome"
       FROM usuarios u
       LEFT JOIN tenants t ON t.id = u."tenantId"
       WHERE u."tenantId" = $1
         AND u.role = ANY($2::text[])
         AND u.sistemas @> ARRAY[$3]::text[]
       ORDER BY u.nome`,
      [tenantId, SYSTEM_ROLES, SYSTEM_KEY],
    );
    return result.rows;
  }

  async findGlobal(): Promise<AdminUserRow[]> {
    const result = await this.pool.query<AdminUserRow>(
      `SELECT u.id, u.email, u.username, u.nome, u.role, u."tenantId", u.ativo, u."mustChangePassword", u."criadoEm",
              NULL AS "tenantSlug", NULL AS "tenantNome"
       FROM usuarios u
       WHERE (u."tenantId" IS NULL OR u."tenantId"::text = '')
         AND u.role = 'super_admin'
         AND u.sistemas @> ARRAY[$1]::text[]
       ORDER BY u.nome`,
      [SYSTEM_KEY],
    );
    return result.rows;
  }

  async findAll(): Promise<AdminUserRow[]> {
    const result = await this.pool.query<AdminUserRow>(
      `SELECT u.id, u.email, u.nome, u.role, u."tenantId", u.ativo, u."mustChangePassword", u."criadoEm",
              t.slug AS "tenantSlug", t.nome AS "tenantNome"
       FROM usuarios u
       LEFT JOIN tenants t ON t.id = u."tenantId"
       WHERE u.role = ANY($1::text[])
       ORDER BY u.nome`,
      [SYSTEM_ROLES],
    );
    return result.rows;
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserRow> {
    // operator_forms and tenant_admin must have a tenant
    if (dto.role !== 'super_admin' && !dto.tenantId) {
      throw new BadRequestException('Operador e Admin de unidade precisam de uma unidade associada');
    }
    // super_admin must NOT have a tenant
    if (dto.role === 'super_admin' && dto.tenantId) {
      throw new BadRequestException('Admin global não deve ter unidade associada');
    }

    const email = `${dto.username}@noreply.local`;

    const existing = await this.pool.query(
      `SELECT id FROM usuarios WHERE email = $1 LIMIT 1`,
      [email],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Nome de usuário já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const tenantId = dto.tenantId ?? null;

    const dbRole = this.toDbRole(dto.role);

    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO usuarios (id, email, username, nome, "senhaHash", role, "tenantId", ativo, "mustChangePassword", sistemas, "criadoEm", "atualizadoEm")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, true, ARRAY[$7]::text[], NOW(), NOW())
       RETURNING id`,
      [email, dto.username, dto.nome, senhaHash, dbRole, tenantId, SYSTEM_KEY],
    );

    const id = result.rows[0].id;

    let tenantSlug: string | null = null;
    let tenantNome: string | null = null;
    if (tenantId) {
      const t = await this.pool.query<{ slug: string; nome: string }>(
        `SELECT slug, nome FROM tenants WHERE id = $1 LIMIT 1`,
        [tenantId],
      );
      tenantSlug = t.rows[0]?.slug ?? null;
      tenantNome = t.rows[0]?.nome ?? null;
    }

    return {
      id, email, username: dto.username, nome: dto.nome, role: dto.role,
      tenantId, tenantSlug, tenantNome, ativo: true, mustChangePassword: true,
      criadoEm: new Date().toISOString(),
    };
  }

  async resetPassword(userId: string, newPassword: string, scopeTenantId: string | null = null): Promise<void> {
    const existing = await this.pool.query(
      `SELECT id FROM usuarios WHERE id = $1 AND role = ANY($2::text[])${scopeTenantId ? ' AND "tenantId" = $3' : ''} LIMIT 1`,
      scopeTenantId ? [userId, SYSTEM_ROLES, scopeTenantId] : [userId, SYSTEM_ROLES],
    );
    if (existing.rows.length === 0) throw new NotFoundException('Usuário não encontrado');

    const senhaHash = await bcrypt.hash(newPassword, 10);
    await this.pool.query(
      `UPDATE usuarios SET "senhaHash" = $1, "mustChangePassword" = true, "atualizadoEm" = NOW() WHERE id = $2`,
      [senhaHash, userId],
    );
  }

  async toggleAtivo(userId: string, ativo: boolean, scopeTenantId: string | null = null): Promise<void> {
    const result = await this.pool.query(
      `UPDATE usuarios SET ativo = $1, "atualizadoEm" = NOW()
       WHERE id = $2 AND role = ANY($3::text[])${scopeTenantId ? ' AND "tenantId" = $4' : ''}`,
      scopeTenantId ? [ativo, userId, SYSTEM_ROLES, scopeTenantId] : [ativo, userId, SYSTEM_ROLES],
    );
    if (result.rowCount === 0) throw new NotFoundException('Usuário não encontrado');
  }

  private toDbRole(role: string): string {
    const map: Record<string, string> = {
      super_admin: 'super_admin',
      tenant_admin: 'tenant_admin',
      operator_forms: 'operator_forms',
    };
    return map[role] ?? role;
  }
}
