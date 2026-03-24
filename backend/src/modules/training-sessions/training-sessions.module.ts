import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingResponseEntity } from './training-response.entity';
import { TrainingSessionsController } from './training-sessions.controller';
import { TrainingResponsesController } from './training-responses.controller';
import { TrainingSessionsService } from './training-sessions.service';
import { TrainingResponsesService } from './training-responses.service';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingSessionEntity, TrainingResponseEntity]),
    TenantModule,
  ],
  controllers: [TrainingSessionsController, TrainingResponsesController],
  providers: [TrainingSessionsService, TrainingResponsesService],
  exports: [TrainingSessionsService, TrainingResponsesService],
})
export class TrainingSessionsModule {}
