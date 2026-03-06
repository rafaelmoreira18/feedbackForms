import { IsOptional, IsString, IsIn, IsEnum } from 'class-validator';
import { Form3Type } from '../forms.entity';

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
  @IsEnum(Form3Type)
  formType?: Form3Type;
}
