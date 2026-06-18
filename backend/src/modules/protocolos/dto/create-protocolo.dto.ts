import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

/** Cabeçalho do paciente — preenchido ao abrir o protocolo ("Novo paciente"). */
export class CreateProtocoloDto {
  /** Tipo de protocolo. Default 'dor_toracica' para compatibilidade. */
  @IsOptional()
  @IsIn(['dor_toracica', 'sepse'])
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
