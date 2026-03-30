import { Module } from '@nestjs/common';
import { RhUsersController } from './rh-users.controller';
import { RhUsersService } from './rh-users.service';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [RhUsersController],
  providers: [RhUsersService],
})
export class RhUsersModule {}
