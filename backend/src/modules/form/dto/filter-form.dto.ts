import { IsOptional, IsString, IsIn } from 'class-validator';

export class FilterFormDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortSatisfaction?: 'asc' | 'desc';
}
