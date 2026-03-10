import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form3ResponseEntity } from './forms.entity';
import { Form3Controller } from './forms.controller';
import { Form3Service } from './forms.service';
import { TenantModule } from '../tenants/tenant.module';
import { FormTemplateEntity } from '../form-templates/form-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form3ResponseEntity, FormTemplateEntity]),
    TenantModule,
  ],
  controllers: [Form3Controller],
  providers: [Form3Service],
  exports: [Form3Service],
})
export class Form3Module {}
