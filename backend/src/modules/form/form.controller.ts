import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormService } from './form.service';
import { CreateFormDto } from './dto/create-form.dto';
import { FilterFormDto } from './dto/filter-form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  create(@Body() dto: CreateFormDto) {
    return this.formService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() filters: FilterFormDto) {
    return this.formService.findAll(filters);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  getMetrics(@Query() filters: FilterFormDto) {
    return this.formService.getMetrics(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.formService.findById(id);
  }
}
