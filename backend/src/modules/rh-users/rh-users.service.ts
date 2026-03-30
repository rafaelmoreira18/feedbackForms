import {
  Injectable,
  ConflictException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { CreateRhUserDto } from './dto/create-rh-user.dto';

export interface RhUserRow {
  id: string;
  email: string;
  nome: string;
  role: string;
  tenantId: string | null;
  ativo: boolean;
  tenantSlug: string | null;
  tenantNome: string | null;
}

@Injectable()
export class RhUsersService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      host: this.config.getOrThrow<string>('AUTH_DB_HOST'),
      port: this.config.get<number>('AUTH_DB_PORT', 5432),
      user: this.config.getOrThrow<string>('AUTH_DB_USERNAME'),
      password: this.config.getOrThrow<string>('AUTH_DB_PASSWORD'),
      database: this.config.getOrThrow<string>('AUTH_DB_DATABASE'),
      ssl:
        this.config.get<string>('AUTH_DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async findTenants(): Promise<{ id: string; slug: string; nome: string }[]> {
    const result = await this.pool.query<{ id: string; slug: string; nome: string }>(
      `SELECT id, slug, nome FROM tenants WHERE ativo = true ORDER BY nome`,
    );
    return result.rows;
  }

  async findAll(): Promise<RhUserRow[]> {
    const result = await this.pool.query<RhUserRow>(`
      SELECT u.id, u.email, u.nome, u.role, u."tenantId", u.ativo,
             t.slug AS "tenantSlug", t.nome AS "tenantNome"
      FROM usuarios u
      LEFT JOIN tenants t ON t.id = u."tenantId"
      WHERE u.role = 'rh'
      ORDER BY u.nome
    `);
    return result.rows;
  }

  async create(dto: CreateRhUserDto): Promise<RhUserRow> {
    const email = `${dto.username}@sistema.local`;

    const existing = await this.pool.query(
      `SELECT id FROM usuarios WHERE email = $1 LIMIT 1`,
      [email],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Nome de usuário já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const tenantId = dto.tenantId ?? null;

    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO usuarios (id, email, nome, "senhaHash", role, "tenantId", ativo, "criadoEm", "atualizadoEm")
       VALUES (gen_random_uuid(), $1, $2, $3, 'rh', $4, true, NOW(), NOW())
       RETURNING id`,
      [email, dto.nome, senhaHash, tenantId],
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

    return { id, email, nome: dto.nome, role: 'rh', tenantId, ativo: true, tenantSlug, tenantNome };
  }
}
