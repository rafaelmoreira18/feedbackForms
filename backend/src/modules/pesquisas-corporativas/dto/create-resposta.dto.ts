import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString() @IsNotEmpty()
  perguntaId: string;

  valor: number | string | boolean | string[];
}

export class CreateRespostaDto {
  @IsOptional() @IsString() @MaxLength(120)
  nomeRespondente?: string;

  @IsOptional() @IsObject()
  metadados?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
