import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePerformanceEvaluationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  colaboradorNome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  setor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  cargo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  gestorArea: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  avaliador: string;

  @IsString()
  @IsNotEmpty()
  dataAvaliacao: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projeto?: string;
}
