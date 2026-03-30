import { IsString, MinLength, MaxLength, Matches, IsUUID } from 'class-validator';

export class CreateRhUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9._-]+$/, { message: 'Apenas letras minúsculas, números, ponto, hífen e underscore' })
  username: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  senha: string;

  @IsUUID()
  tenantId: string;
}
