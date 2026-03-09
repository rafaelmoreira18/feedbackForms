import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Form3Service } from './forms.service';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('forms3')
export class Form3Controller {
  constructor(private readonly form3Service: Form3Service) {}

  @Post()
  create(@Body() dto: CreateForm3Dto) {
    return this.form3Service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() filters: FilterForm3Dto) {
    return this.form3Service.findAll(filters);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  getMetrics(@Query() filters: FilterForm3Dto) {
    return this.form3Service.getMetrics(filters);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteAll() {
    return this.form3Service.deleteAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.form3Service.findById(id);
  }
}
