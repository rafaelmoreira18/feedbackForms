import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

/** Cabeçalho do paciente — preenchido ao abrir o protocolo ("Novo paciente"). */
export class CreateProtocoloDto {
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
}
