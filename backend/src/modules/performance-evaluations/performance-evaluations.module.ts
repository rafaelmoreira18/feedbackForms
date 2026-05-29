import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEvaluationEntity } from './entities/performance-evaluation.entity';
import { PerformanceEvaluationsController } from './performance-evaluations.controller';
import { PerformanceEvaluationsService } from './performance-evaluations.service';
import { TenantModule } from '../tenants/tenant.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceEvaluationEntity]),
    TenantModule,
    AuditLogModule,
  ],
  controllers: [PerformanceEvaluationsController],
  providers: [PerformanceEvaluationsService],
  exports: [PerformanceEvaluationsService],
})
export class PerformanceEvaluationsModule {}
