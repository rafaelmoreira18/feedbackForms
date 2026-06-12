import { IsString, IsOptional, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Encerramento antecipado do protocolo pelo médico (em qualquer etapa), por
 * não-continuidade ou não-indicação. Conclui o protocolo sem percorrer as etapas.
 */
export class EncerrarProtocoloDto {
  @IsString()
  @IsIn(['nao_continuidade', 'nao_indicacao'], {
    message: 'Motivo deve ser nao_continuidade ou nao_indicacao',
  })
  motivo: 'nao_continuidade' | 'nao_indicacao';

  @IsString()
  @IsNotEmpty({ message: 'Descreva o motivo do encerramento' })
  @MaxLength(500)
  observacao: string;

  // Identidade do médico — preenchida a partir do usuário logado.
  @IsOptional() @IsString() @MaxLength(160) responsavelNome?: string;
  @IsOptional() @IsString() @MaxLength(40) registroProfissional?: string;
}
