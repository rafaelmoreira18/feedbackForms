import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('holding_admin', 'hospital_admin')
  findAll(@Req() req: Request) {
    const user = req.user as { role: string; tenantId: string | null };
    return this.userService.findAll(user);
  }
}
