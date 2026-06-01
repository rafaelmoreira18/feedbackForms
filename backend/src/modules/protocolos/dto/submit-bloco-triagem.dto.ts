import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SinaisVitaisDto {
  @IsOptional() @IsString() @MaxLength(20) paMsd: string = '';
  @IsOptional() @IsString() @MaxLength(20) paMse: string = '';
  @IsOptional() @IsString() @MaxLength(10) fc: string = '';
  @IsOptional() @IsString() @MaxLength(10) fr: string = '';
  @IsOptional() @IsString() @MaxLength(10) spo2: string = '';
  @IsOptional() @IsString() @MaxLength(10) tax: string = '';
  @IsOptional() @IsString() @MaxLength(10) glicemia: string = '';
}

class QueixaPrincipalDto {
  @IsOptional() @IsBoolean() dorToracica: boolean = false;
  @IsOptional() @IsBoolean() dispneiaSubita: boolean = false;
  @IsOptional() @IsBoolean() sudoreseNauseaSincope: boolean = false;
  @IsOptional() @IsBoolean() dorIrradiada: boolean = false;
}

class DerivacoesExtrasDto {
  @IsOptional() @IsBoolean() v3rV4r: boolean = false;
  @IsOptional() @IsBoolean() v7v9: boolean = false;
  @IsOptional() @IsBoolean() ecgSeriado: boolean = false;
}

export class SubmitBlocoTriagemDto {
  // Responsável pela etapa (obrigatório)
  @IsString()
  @IsNotEmpty({ message: 'Nome do responsável é obrigatório' })
  @MaxLength(160)
  responsavelNome: string;

  @IsString()
  @IsNotEmpty({ message: 'Registro profissional (COREN/CRM) é obrigatório' })
  @MaxLength(40)
  registroProfissional: string;

  // ETAPA 1 — Triagem
  @IsOptional() @IsString() @MaxLength(5) inicioTriagem: string = '';
  @IsOptional() @IsIn(['vermelho', 'laranja', '']) classificacaoManchester: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => SinaisVitaisDto)
  sinaisVitais?: SinaisVitaisDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QueixaPrincipalDto)
  queixaPrincipal?: QueixaPrincipalDto;

  @IsOptional() @IsString() @MaxLength(10) inicioSintomasData: string = '';
  @IsOptional() @IsString() @MaxLength(5) inicioSintomasHora: string = '';
  @IsOptional() @IsBoolean() alergias: boolean = false;
  @IsOptional() @IsString() @MaxLength(300) alergiasDescricao: string = '';
  @IsOptional() @IsBoolean() instabilidade: boolean = false;

  // ETAPA 2 — ECG
  @IsOptional() @IsString() @MaxLength(5) primeiroEcgHora: string = '';
  @IsOptional() @IsString() @MaxLength(5) interpretacaoMedicaHora: string = '';
  @IsOptional() @IsIn(['via_i', 'via_ii', 'via_iii', '']) resultadoEcg: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => DerivacoesExtrasDto)
  derivacoesExtras?: DerivacoesExtrasDto;
}
