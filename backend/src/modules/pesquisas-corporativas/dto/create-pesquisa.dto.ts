import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PerguntaDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() texto: string;

  @IsIn(['likert5', 'likert3', 'nps', 'aberta', 'opcoes', 'multipla', 'booleano'])
  escala: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  opcoes?: string[];

  @IsBoolean()
  obrigatoria: boolean;

  @IsNumber()
  ordem: number;
}

export class BlocoDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() titulo: string;
  @IsOptional() @IsString() descricao?: string;
  @IsNumber() ordem: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerguntaDto)
  perguntas: PerguntaDto[];
}

export class CreatePesquisaDto {
  @IsString() @MinLength(3) @MaxLength(120)
  titulo: string;

  @IsString() @IsNotEmpty()
  tipo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlocoDto)
  blocos: BlocoDto[];

  @IsOptional() @IsBoolean()
  ativa?: boolean;

  @IsOptional() @IsString() @MaxLength(50)
  periodo?: string;
}
