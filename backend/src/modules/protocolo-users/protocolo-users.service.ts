import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { CreateProtocoloUserDto } from './dto/create-protocolo-user.dto';
import { TenantService } from '../tenants/tenant.service';
import { AUTH_DB_POOL } from '../auth-db/auth-db.module';
import { PROTOCOLO_ROLES, ROLES_COM_REGISTRO } from '../protocolos/protocolo-roles';

export interface ProtocoloUserRow {
  id: string;
  email: string;
  username: string | null;
  nome: string;
  role: string;
  registroProfissional: string;
  tenantId: string | null;
  ativo: boolean;
  tenantSlug: string | null;
  tenantNome: string | null;
}

@Injectable()
export class ProtocoloUsersService {
  constructor(
    @Inject(AUTH_DB_POOL) private readonly pool: Pool,
    private readonly tenantService: TenantService,
  ) {}

  /** Unidades ativas para atribuição (admin global). */
  async findTenants(): Promise<{ id: string; slug: string; nome: string }[]> {
    const tenants = await this.tenantService.findAllActive();
    return tenants.map((t) => ({ id: t.id, slug: t.slug, nome: t.name }));
  }

  /** Lista usuários do módulo Protocolos. Se tenantId for informado, restringe à unidade. */
  async findAll(tenantId?: string | null): Promise<ProtocoloUserRow[]> {
    const params: unknown[] = [PROTOCOLO_ROLES];
    let where = `u.role = ANY($1)`;
    if (tenantId) {
      params.push(tenantId);
      where += ` AND u."tenantId" = $2`;
    }
    const result = await this.pool.query<ProtocoloUserRow>(
      `SELECT u.id, u.email, u.username, u.nome, u.role,
              COALESCE(u."registroProfissional", '') AS "registroProfissional",
              u."tenantId", u.ativo,
              t.slug AS "tenantSlug", t.nome AS "tenantNome"
       FROM usuarios u
       LEFT JOIN tenants t ON t.id = u."tenantId"
       WHERE ${where}
       ORDER BY u.nome`,
      params,
    );
    return result.rows;
  }

  async create(dto: CreateProtocoloUserDto): Promise<ProtocoloUserRow> {
    const email = `${dto.username}@sistema.local`;

    // Médico e operador preenchem/fecham etapas → registro profissional é obrigatório.
    const registroProfissional = (dto.registroProfissional ?? '').trim();
    if ((ROLES_COM_REGISTRO as readonly string[]).includes(dto.role) && !registroProfissional) {
      throw new BadRequestException(
        'Registro profissional (CRM/COREN) é obrigatório para operador e médico.',
      );
    }

    const existing = await this.pool.query(
      `SELECT id FROM usuarios WHERE email = $1 OR username = $2 LIMIT 1`,
      [email, dto.username],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Nome de usuário já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const tenantId = dto.tenantId ?? null;

    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO usuarios
         (id, email, username, nome, "senhaHash", role, "registroProfissional", "tenantId", ativo, "mustChangePassword", sistemas, "criadoEm", "atualizadoEm")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, true, ARRAY['feedbackforms']::text[], NOW(), NOW())
       RETURNING id`,
      [email, dto.username, dto.nome, senhaHash, dto.role, registroProfissional, tenantId],
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
      id,
      email,
      username: dto.username,
      nome: dto.nome,
      role: dto.role,
      registroProfissional,
      tenantId,
      ativo: true,
      tenantSlug,
      tenantNome,
    };
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const existing = await this.pool.query(
      `SELECT id FROM usuarios WHERE id = $1 AND role = ANY($2) LIMIT 1`,
      [userId, PROTOCOLO_ROLES],
    );
    if (existing.rows.length === 0) throw new NotFoundException('Usuário não encontrado');

    const senhaHash = await bcrypt.hash(newPassword, 10);
    await this.pool.query(
      `UPDATE usuarios SET "senhaHash" = $1, "mustChangePassword" = true, "atualizadoEm" = NOW() WHERE id = $2`,
      [senhaHash, userId],
    );
  }

  async setActive(userId: string, ativo: boolean, tenantId?: string | null): Promise<void> {
    const params: unknown[] = [userId, PROTOCOLO_ROLES];
    let where = `id = $1 AND role = ANY($2)`;
    if (tenantId) {
      params.push(tenantId);
      where += ` AND "tenantId" = $3`;
    }
    const result = await this.pool.query(
      `UPDATE usuarios SET ativo = $${params.length + 1}, "atualizadoEm" = NOW() WHERE ${where}`,
      [...params, ativo],
    );
    if (result.rowCount === 0) throw new NotFoundException('Usuário não encontrado');
  }

  /** Retorna o tenantId de um usuário do módulo (para validação de escopo). */
  async findUserTenant(userId: string): Promise<string | null | undefined> {
    const r = await this.pool.query<{ tenantId: string | null }>(
      `SELECT "tenantId" FROM usuarios WHERE id = $1 AND role = ANY($2) LIMIT 1`,
      [userId, PROTOCOLO_ROLES],
    );
    return r.rows[0]?.tenantId;
  }
}
