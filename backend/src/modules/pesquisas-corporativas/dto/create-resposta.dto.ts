import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateRespostaDto {
  @IsOptional() @IsString() @MaxLength(120)
  nomeRespondente?: string;

  @IsOptional() @IsObject()
  metadados?: Record<string, unknown>;

  @IsArray()
  answers: Array<{ perguntaId: string; valor: number | string | boolean | string[] }>;
}
