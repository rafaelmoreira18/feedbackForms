import { IsString, MinLength, Matches, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9._-]+$/, { message: 'Apenas letras minúsculas, números, ponto, hífen e underscore' })
  username: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsIn(['operator_forms', 'tenant_admin', 'super_admin'])
  role: 'operator_forms' | 'tenant_admin' | 'super_admin';

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
