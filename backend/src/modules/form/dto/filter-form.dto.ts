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
  evaluatedDepartment?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortSatisfaction?: 'asc' | 'desc';
}
