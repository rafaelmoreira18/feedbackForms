import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DerivacoesExtrasDto {
  @IsOptional() @IsBoolean() v3rV4r: boolean = false;
  @IsOptional() @IsBoolean() v7v9: boolean = false;
  @IsOptional() @IsBoolean() ecgSeriado: boolean = false;
}

/** ETAPA 2 — ECG. Realizada em horário separado da triagem (bloco/etapa próprio). */
export class SubmitBlocoEcgDto {
  // Responsável — preenchido a partir do usuário logado.
  @IsOptional() @IsString() @MaxLength(160) responsavelNome?: string;
  @IsOptional() @IsString() @MaxLength(40) registroProfissional?: string;

  @IsOptional() @IsString() @MaxLength(5) primeiroEcgHora: string = '';
  @IsOptional() @IsString() @MaxLength(5) interpretacaoMedicaHora: string = '';
  @IsOptional() @IsIn(['via_i', 'via_ii', 'via_iii', '']) resultadoEcg: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => DerivacoesExtrasDto)
  derivacoesExtras?: DerivacoesExtrasDto;
}
