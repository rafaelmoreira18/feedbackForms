import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form3Controller } from './forms.controller';
import { Form3Service } from './forms.service';
import { Form3ResponseEntity } from './forms.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Form3ResponseEntity])],
  controllers: [Form3Controller],
  providers: [Form3Service],
  exports: [Form3Service],
})
export class Form3Module {}
