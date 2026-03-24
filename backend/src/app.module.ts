import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { FormTemplateModule } from './modules/form-templates/form-template.module';
import { Form3Module } from './modules/forms/forms.module';
import { TenantEntity } from './modules/tenants/tenant.entity';
import { UserEntity } from './modules/user/user.entity';
import { Form3ResponseEntity } from './modules/forms/forms.entity';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from './modules/form-templates/form-template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const required = ['JWT_SECRET', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
        return config;
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        entities: [
          TenantEntity,
          UserEntity,
          Form3ResponseEntity,
          FormTemplateEntity,
          FormTemplateBlockEntity,
          FormQuestionEntity,
        ],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        ssl:
          config.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // Global: 60 requests per minute per IP (strict limit applied per-route on public endpoints)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    AuthModule,
    UserModule,
    TenantModule,
    FormTemplateModule,
    Form3Module,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
