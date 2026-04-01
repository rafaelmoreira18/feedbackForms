import { Injectable, UnauthorizedException, OnModuleDestroy, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { LoginDto } from './dto/login.dto';

/** Maps Multi_UnidadesDB roles to feedbackforms roles */
const ROLE_MAP: Record<string, string> = {
  super_admin: 'holding_admin',
  tenant_admin: 'hospital_admin',
  operator_forms: 'operator_forms',
  operator: 'viewer',       // legado — operator sem sufixo cai em viewer (sem acesso a formulários protegidos)
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
  mustChangePassword: boolean;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
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
      ssl: this.config.get<string>('AUTH_DB_SSL') === 'true'
        ? { rejectUnauthorized: this.config.get<string>('AUTH_DB_SSL_REJECT_UNAUTHORIZED', 'true') !== 'false' }
        : false,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async findUserByLogin(login: string): Promise<ExternalUser | null> {
    const result = await this.pool.query<ExternalUser>(
      `SELECT id, email, nome, "senhaHash", role, "tenantId", ativo, COALESCE("mustChangePassword", false) AS "mustChangePassword"
       FROM usuarios
       WHERE email = $1 OR username = $1
       LIMIT 1`,
      [login],
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

  async login(dto: LoginDto, ip = 'unknown') {
    const user = await this.findUserByLogin(dto.login);

    if (!user || !user.ativo) {
      this.logger.warn(`[AUDIT] LOGIN_FAILED login="${dto.login}" reason="user_not_found_or_inactive" ip="${ip}" ts="${new Date().toISOString()}"`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.senhaHash);
    if (!passwordValid) {
      this.logger.warn(`[AUDIT] LOGIN_FAILED login="${dto.login}" reason="wrong_password" ip="${ip}" ts="${new Date().toISOString()}"`);
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

    this.logger.log(`[AUDIT] LOGIN_SUCCESS email="${user.email}" role="${role}" ip="${ip}" ts="${new Date().toISOString()}"`);

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.nome,
        role,
        tenantId: user.tenantId ?? null,
        tenantSlug,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async changePassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {
    const result = await this.pool.query<{ senhaHash: string; mustChangePassword: boolean }>(
      `SELECT "senhaHash", COALESCE("mustChangePassword", false) AS "mustChangePassword" FROM usuarios WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) throw new UnauthorizedException('Usuário não encontrado');

    if (!row.mustChangePassword) {
      if (!currentPassword) throw new UnauthorizedException('Senha atual obrigatória');
      const valid = await bcrypt.compare(currentPassword, row.senhaHash);
      if (!valid) throw new UnauthorizedException('Senha atual incorreta');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.pool.query(
      `UPDATE usuarios SET "senhaHash" = $1, "mustChangePassword" = false, "atualizadoEm" = NOW() WHERE id = $2`,
      [newHash, userId],
    );
  }
}
