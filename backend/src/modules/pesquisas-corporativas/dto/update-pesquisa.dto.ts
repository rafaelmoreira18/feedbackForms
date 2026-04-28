import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdatePesquisaDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(120)
  titulo?: string;

  @IsOptional() @IsBoolean()
  ativa?: boolean;

  @IsOptional() @IsString() @MaxLength(50)
  periodo?: string;
}
