import { Module } from '@nestjs/common';
import { RhUsersController } from './rh-users.controller';
import { RhUsersService } from './rh-users.service';

@Module({
  controllers: [RhUsersController],
  providers: [RhUsersService],
})
export class RhUsersModule {}
