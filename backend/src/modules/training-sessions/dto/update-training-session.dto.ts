import { IsString, IsOptional, IsIn, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateTrainingSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  trainingDate?: string;

  @IsOptional()
  @IsIn(['eficacia', 'reacao'])
  trainingType?: 'eficacia' | 'reacao';

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instructor?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
