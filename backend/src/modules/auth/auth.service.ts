import { Injectable, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { LoginDto } from './dto/login.dto';

/** Maps Multi_UnidadesDB roles to feedbackforms roles */
const ROLE_MAP: Record<string, string> = {
  super_admin: 'holding_admin',
  tenant_admin: 'hospital_admin',
  operator: 'viewer',
  rh: 'rh_admin',
};

interface ExternalUser {
  id: string;
  email: string;
  nome: string;
  senhaHash: string;
  role: string;
  tenantId: string | null;
  ativo: boolean;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.pool = new Pool({
      host: this.config.getOrThrow<string>('AUTH_DB_HOST'),
      port: this.config.get<number>('AUTH_DB_PORT', 5432),
      user: this.config.getOrThrow<string>('AUTH_DB_USERNAME'),
      password: this.config.getOrThrow<string>('AUTH_DB_PASSWORD'),
      database: this.config.getOrThrow<string>('AUTH_DB_DATABASE'),
      ssl: this.config.get<string>('AUTH_DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async findUserByEmail(email: string): Promise<ExternalUser | null> {
    const result = await this.pool.query<ExternalUser>(
      `SELECT id, email, nome, "senhaHash", role, "tenantId", ativo
       FROM usuarios
       WHERE email = $1
       LIMIT 1`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  private async findTenantSlug(tenantId: string): Promise<string | null> {
    const result = await this.pool.query<{ slug: string }>(
      `SELECT slug FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );
    return result.rows[0]?.slug ?? null;
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.senhaHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const role = ROLE_MAP[user.role] ?? 'viewer';

    const payload = {
      sub: user.id,
      email: user.email,
      role,
      tenantId: user.tenantId ?? null,
    };

    let tenantSlug: string | null = null;
    if (user.tenantId) {
      tenantSlug = await this.findTenantSlug(user.tenantId);
    }

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.nome,
        role,
        tenantId: user.tenantId ?? null,
        tenantSlug,
      },
    };
  }
}
