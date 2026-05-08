import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, IsIn, IsArray, IsUUID } from 'class-validator';

export class UpdatePesquisaDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(120)
  titulo?: string;

  @IsOptional() @IsBoolean()
  ativa?: boolean;

  @IsOptional() @IsString() @MaxLength(50)
  periodo?: string;

  @IsOptional() @IsString() @MaxLength(100)
  categoria?: string;

  @IsOptional() @IsIn(['global', 'especifica', 'privada'])
  visibility?: 'global' | 'especifica' | 'privada';

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  allowedTenantIds?: string[];

  @IsOptional() @IsBoolean()
  visivelParaUnidade?: boolean;
}
