import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateProtocoloUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Apenas letras minúsculas, números, ponto, hífen e underscore',
  })
  username: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  senha: string;

  @IsIn([
    'protocolo_operador',
    'protocolo_medico',
    'protocolo_admin',
    'protocolo_admin_global',
  ])
  role:
    | 'protocolo_operador'
    | 'protocolo_medico'
    | 'protocolo_admin'
    | 'protocolo_admin_global';

  /**
   * Registro profissional (CRM para médico, COREN para enfermagem). Obrigatório para
   * quem preenche/fecha etapas (operador e médico); opcional para perfis administrativos.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  registroProfissional?: string;

  /** Unidade do usuário. Obrigatória para operador/admin de unidade; nula para admin global. */
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
