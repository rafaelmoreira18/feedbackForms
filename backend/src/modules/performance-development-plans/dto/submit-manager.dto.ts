import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export class PdiActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  acao: string;

  @IsIn(['colaborador', 'empresa'])
  responsabilidade: 'colaborador' | 'empresa';

  @IsString()
  @IsNotEmpty()
  competenciaId: string;

  @IsString()
  @IsNotEmpty()
  prazo: string;
}

export class SubmitManagerDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PdiActionDto)
  actions: PdiActionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  managerFeedback?: string;
}
