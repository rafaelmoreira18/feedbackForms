import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class SubmitColaboradorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  colaboradorNome: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comentario?: string;
}
