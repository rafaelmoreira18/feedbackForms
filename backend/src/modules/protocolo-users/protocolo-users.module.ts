import { Module } from '@nestjs/common';
import { ProtocoloUsersController } from './protocolo-users.controller';
import { ProtocoloUsersService } from './protocolo-users.service';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [ProtocoloUsersController],
  providers: [ProtocoloUsersService],
})
export class ProtocoloUsersModule {}
