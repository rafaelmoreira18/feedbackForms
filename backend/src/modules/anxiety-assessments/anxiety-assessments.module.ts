import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnxietyAssessmentEntity } from './anxiety-assessment.entity';
import { AnxietyAssessmentsController } from './anxiety-assessments.controller';
import { AnxietyAssessmentsService } from './anxiety-assessments.service';
import { TenantModule } from '../tenants/tenant.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnxietyAssessmentEntity]),
    TenantModule,
    AuditLogModule,
  ],
  controllers: [AnxietyAssessmentsController],
  providers: [AnxietyAssessmentsService],
  exports: [AnxietyAssessmentsService],
})
export class AnxietyAssessmentsModule {}
