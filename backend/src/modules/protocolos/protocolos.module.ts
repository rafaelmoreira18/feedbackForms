import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocoloEntity } from './entities/protocolo.entity';
import { ProtocolosController } from './protocolos.controller';
import { ProtocolosService } from './protocolos.service';
import { TenantModule } from '../tenants/tenant.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProtocoloEntity]), TenantModule, AuditLogModule],
  controllers: [ProtocolosController],
  providers: [ProtocolosService],
  exports: [ProtocolosService],
})
export class ProtocolosModule {}
