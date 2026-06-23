import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateAnxietyAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  colaboradorNome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  setor?: string;

  @IsOptional()
  @IsString()
  dataAplicacao?: string;

  /** Liga/desliga o link público de preenchimento. */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
