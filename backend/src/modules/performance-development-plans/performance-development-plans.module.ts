import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceDevelopmentPlanEntity } from './entities/performance-development-plan.entity';
import { PerformanceEvaluationEntity } from '../performance-evaluations/entities/performance-evaluation.entity';
import { PerformanceDevelopmentPlansController } from './performance-development-plans.controller';
import { PerformanceDevelopmentPlansService } from './performance-development-plans.service';
import { TenantModule } from '../tenants/tenant.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceDevelopmentPlanEntity,
      PerformanceEvaluationEntity,
    ]),
    TenantModule,
    AuditLogModule,
  ],
  controllers: [PerformanceDevelopmentPlansController],
  providers: [PerformanceDevelopmentPlansService],
  exports: [PerformanceDevelopmentPlansService],
})
export class PerformanceDevelopmentPlansModule {}
