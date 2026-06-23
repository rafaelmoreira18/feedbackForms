import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateAnxietyAssessmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  colaboradorNome: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  setor?: string;

  /** ISO date string: "2026-06-23" */
  @IsString()
  @IsNotEmpty()
  dataAplicacao: string;
}
