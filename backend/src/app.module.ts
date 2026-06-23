import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthDbModule } from './modules/auth-db/auth-db.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { FormTemplateModule } from './modules/form-templates/form-template.module';
import { Form3Module } from './modules/forms/forms.module';
import { TrainingSessionsModule } from './modules/training-sessions/training-sessions.module';
import { RhUsersModule } from './modules/rh-users/rh-users.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { TenantEntity } from './modules/tenants/tenant.entity';
import { Form3ResponseEntity } from './modules/forms/forms.entity';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from './modules/form-templates/form-template.entity';
import { TrainingSessionEntity } from './modules/training-sessions/training-session.entity';
import { TrainingResponseEntity } from './modules/training-sessions/training-response.entity';
import { AuditLogEntity } from './modules/audit-log/audit-log.entity';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { PesquisasCorporativasModule } from './modules/pesquisas-corporativas/pesquisas-corporativas.module';
import { PesquisaCorporativaEntity } from './modules/pesquisas-corporativas/entities/pesquisa-corporativa.entity';
import { PesquisaRespostaEntity } from './modules/pesquisas-corporativas/entities/pesquisa-resposta.entity';
import { PerformanceEvaluationsModule } from './modules/performance-evaluations/performance-evaluations.module';
import { PerformanceEvaluationEntity } from './modules/performance-evaluations/entities/performance-evaluation.entity';
import { PerformanceDevelopmentPlansModule } from './modules/performance-development-plans/performance-development-plans.module';
import { PerformanceDevelopmentPlanEntity } from './modules/performance-development-plans/entities/performance-development-plan.entity';
import { ProtocolosModule } from './modules/protocolos/protocolos.module';
import { ProtocoloEntity } from './modules/protocolos/entities/protocolo.entity';
import { ProtocoloUsersModule } from './modules/protocolo-users/protocolo-users.module';
import { AnxietyAssessmentsModule } from './modules/anxiety-assessments/anxiety-assessments.module';
import { AnxietyAssessmentEntity } from './modules/anxiety-assessments/anxiety-assessment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const required = [
          'JWT_SECRET',
          'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE',
          'AUTH_DB_HOST', 'AUTH_DB_USERNAME', 'AUTH_DB_PASSWORD', 'AUTH_DB_DATABASE',
        ];
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
          Form3ResponseEntity,
          FormTemplateEntity,
          FormTemplateBlockEntity,
          FormQuestionEntity,
          TrainingSessionEntity,
          TrainingResponseEntity,
          AuditLogEntity,
          PesquisaCorporativaEntity,
          PesquisaRespostaEntity,
          PerformanceEvaluationEntity,
          PerformanceDevelopmentPlanEntity,
          ProtocoloEntity,
          AnxietyAssessmentEntity,
        ],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        ssl:
          config.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: config.get<string>('DB_SSL_REJECT_UNAUTHORIZED', 'true') !== 'false' }
            : false,
        extra: {
          statement_timeout: 30_000,
        },
      }),
    }),

    // Global: 60 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    AuthDbModule,
    AuthModule,
    TenantModule,
    FormTemplateModule,
    Form3Module,
    TrainingSessionsModule,
    RhUsersModule,
    AdminUsersModule,
    AuditLogModule,
    PesquisasCorporativasModule,
    PerformanceEvaluationsModule,
    PerformanceDevelopmentPlansModule,
    ProtocolosModule,
    ProtocoloUsersModule,
    AnxietyAssessmentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
