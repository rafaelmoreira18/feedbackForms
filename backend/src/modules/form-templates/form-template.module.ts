import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from './form-template.entity';
import { FormTemplateService } from './form-template.service';
import { FormTemplateController } from './form-template.controller';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormTemplateEntity, FormTemplateBlockEntity, FormQuestionEntity]),
    TenantModule,
  ],
  controllers: [FormTemplateController],
  providers: [FormTemplateService],
  exports: [FormTemplateService],
})
export class FormTemplateModule {}
