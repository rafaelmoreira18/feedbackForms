import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class PerformanceAnswerDto {
  @IsString()
  @IsNotEmpty()
  competenciaId: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  valor: number;

  @IsOptional()
  @IsString()
  justificativa?: string;
}

export class SubmitAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PerformanceAnswerDto)
  answers: PerformanceAnswerDto[];
}
