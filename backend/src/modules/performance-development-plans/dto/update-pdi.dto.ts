import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePdiDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
