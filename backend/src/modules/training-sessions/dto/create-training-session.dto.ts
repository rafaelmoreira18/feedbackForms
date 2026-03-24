import { IsString, IsNotEmpty, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateTrainingSessionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  trainingDate: string;

  @IsIn(['eficacia', 'reacao'])
  trainingType: 'eficacia' | 'reacao';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instructor: string;
}
