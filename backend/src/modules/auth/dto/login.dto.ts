import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  /** Aceita e-mail ou username (ex: equipe.hrgm) */
  @IsString()
  @Transform(({ value }) => value?.trim())
  login: string;

  @IsString()
  @MinLength(6)
  password: string;
}
