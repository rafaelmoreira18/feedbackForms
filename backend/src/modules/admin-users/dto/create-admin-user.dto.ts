import { IsString, MinLength, MaxLength, Matches, IsIn, IsOptional } from 'class-validator';

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

  // String (não @IsUUID): alguns tenants têm id "semente" (ex.: hrpg = 0000…0001).
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tenantId?: string;
}
