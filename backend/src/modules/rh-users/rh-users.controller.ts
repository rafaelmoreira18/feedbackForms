import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { RhUsersService } from './rh-users.service';
import { CreateRhUserDto } from './dto/create-rh-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('rh/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('rh_admin')
export class RhUsersController {
  constructor(private readonly rhUsersService: RhUsersService) {}

  @Get('tenants')
  findTenants() {
    return this.rhUsersService.findTenants();
  }

  @Get()
  findAll() {
    return this.rhUsersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateRhUserDto, @Req() req: Request) {
    try {
      return await this.rhUsersService.create(dto);
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw err;
    }
  }
}
