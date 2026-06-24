import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';
import { PROTOCOL_TYPES } from '../protocolo-definitions';

/** Cabeçalho do paciente — preenchido ao abrir o protocolo ("Novo paciente"). */
export class CreateProtocoloDto {
  /** Tipo de protocolo. Default 'dor_toracica' para compatibilidade. Aceita qualquer tipo registrado. */
  @IsOptional()
  @IsIn(PROTOCOL_TYPES)
  protocolType?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  pacienteNome: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroProntuario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dataNascimento?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsString()
  @MaxLength(3)
  idade?: string;

  @IsOptional()
  @IsIn(['M', 'F', 'O', ''])
  sexo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dataAtendimento?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaChegada?: string; // "HH:mm"

  /** Sepse pediátrica: peso em kg (cálculo de doses). */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  pesoKg?: string;

  /** Sepse: variante resolvida pela idade. */
  @IsOptional()
  @IsIn(['adulto', 'pediatrico', ''])
  variante?: string;
}
