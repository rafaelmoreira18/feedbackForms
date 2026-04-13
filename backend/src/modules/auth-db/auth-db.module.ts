import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const AUTH_DB_POOL = 'AUTH_DB_POOL';

/**
 * Módulo global que expõe um único Pool de conexão para o Autenticacao_DB.
 * Importar nos módulos que precisam de acesso direto ao banco de autenticação
 * em vez de cada serviço criar seu próprio pool.
 */
@Global()
@Module({
  providers: [
    {
      provide: AUTH_DB_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        return new Pool({
          host: config.getOrThrow<string>('AUTH_DB_HOST'),
          port: config.get<number>('AUTH_DB_PORT', 5432),
          user: config.getOrThrow<string>('AUTH_DB_USERNAME'),
          password: config.getOrThrow<string>('AUTH_DB_PASSWORD'),
          database: config.getOrThrow<string>('AUTH_DB_DATABASE'),
          ssl:
            config.get<string>('AUTH_DB_SSL') === 'true'
              ? { rejectUnauthorized: config.get<string>('AUTH_DB_SSL_REJECT_UNAUTHORIZED', 'true') !== 'false' }
              : false,
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        });
      },
    },
  ],
  exports: [AUTH_DB_POOL],
})
export class AuthDbModule {}
