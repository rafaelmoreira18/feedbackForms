import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ColetaTroponinaDto {
  @IsOptional() @IsString() @MaxLength(5) horaColeta: string = '';
  @IsOptional() @IsString() @MaxLength(20) resultado: string = '';
  @IsOptional() @IsString() @MaxLength(5) horaResultadoLab: string = '';
}

class DiagnosticosDiferenciaisDto {
  @IsOptional() @IsBoolean() naoSeAplica: boolean = false;
  @IsOptional() @IsBoolean() dissecaoAorta: boolean = false;
  @IsOptional() @IsString() @MaxLength(20) dissecaoAortaAddRs: string = '';
  @IsOptional() @IsBoolean() tep: boolean = false;
  @IsOptional() @IsString() @MaxLength(20) tepWells: string = '';
  @IsOptional() @IsBoolean() pericardite: boolean = false;
  @IsOptional() @IsBoolean() takotsubo: boolean = false;
  @IsOptional() @IsBoolean() pneumotorax: boolean = false;
  @IsOptional() @IsBoolean() tamponamento: boolean = false;
}

export class SubmitBlocoInvestigacaoDto {
  @IsOptional() @IsString() @MaxLength(160) responsavelNome?: string;
  @IsOptional() @IsString() @MaxLength(40) registroProfissional?: string;

  // Troponina convencional 0-3-6h
  @IsOptional() @IsString() @MaxLength(20) lsnUnidade: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => ColetaTroponinaDto)
  coleta0h?: ColetaTroponinaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColetaTroponinaDto)
  coleta3h?: ColetaTroponinaDto;

  @IsOptional() @IsString() @MaxLength(20) coleta3hDeltaPct: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => ColetaTroponinaDto)
  coleta6h?: ColetaTroponinaDto;

  @IsOptional() @IsIn(['rule_in', 'rule_out', 'inconclusivo', '']) troponinaInterpretacao: string = '';

  // Escore HEART (cada item 0/1/2)
  @IsOptional() @IsInt() @Min(0) @Max(2) heartH: number = 0;
  @IsOptional() @IsInt() @Min(0) @Max(2) heartE: number = 0;
  @IsOptional() @IsInt() @Min(0) @Max(2) heartA: number = 0;
  @IsOptional() @IsInt() @Min(0) @Max(2) heartR: number = 0;
  @IsOptional() @IsInt() @Min(0) @Max(2) heartT: number = 0;
  @IsOptional() @IsInt() @Min(0) @Max(10) heartTotal: number = 0;
  @IsOptional() @IsIn(['baixo', 'intermediario', 'alto', '']) heartFaixaRisco: string = '';
  @IsOptional() @IsIn(['alta_segura', 'observacao', 'internacao', '']) condutaHeart: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosticosDiferenciaisDto)
  diagnosticos?: DiagnosticosDiferenciaisDto;
}
