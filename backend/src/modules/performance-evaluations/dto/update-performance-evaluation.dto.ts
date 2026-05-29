import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePerformanceEvaluationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  colaboradorNome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  setor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gestorArea?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  avaliador?: string;

  @IsOptional()
  @IsString()
  dataAvaliacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projeto?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
