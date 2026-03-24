import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class TrainingAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}

export class CreateTrainingResponseDto {
  /** The training session slug */
  @IsString()
  @IsNotEmpty()
  sessionSlug: string;

  /** Respondent name */
  @IsString()
  @IsNotEmpty()
  respondentName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingAnswerDto)
  answers: TrainingAnswerDto[];

  /** Free-text: ponto alto */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pointoAlto?: string;

  /** Free-text: o que já aplica */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  jaAplica?: string;

  /** Recommends: true | false (Avaliação de Reação only) */
  @IsOptional()
  recomenda?: boolean;

  /** Por quê / motivo */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recomendaMotivo?: string;

  /** General comments / suggestions */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
