import { IsOptional, IsDateString, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterForm3Dto {
  @IsOptional()
  @IsDateString({}, { message: 'startDate deve ser uma data válida (YYYY-MM-DD)' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate deve ser uma data válida (YYYY-MM-DD)' })
  endDate?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortSatisfaction?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  formType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
