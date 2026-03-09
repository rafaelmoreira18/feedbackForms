import { IsOptional, IsString, IsIn } from 'class-validator';

export class FilterForm3Dto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortSatisfaction?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  formType?: string;
}
