import { IsOptional, IsString, IsIn } from 'class-validator';

export class FilterProtocoloDto {
  /** Filtra por etapa corrente. "abertos" = todos != concluido (default na listagem) */
  @IsOptional()
  @IsIn(['triagem', 'investigacao', 'desfecho', 'concluido', 'abertos'])
  stage?: string;

  /** Janela de datas (dataAtendimento) — usada nas métricas/dashboard */
  @IsOptional()
  @IsString()
  startDate?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsString()
  endDate?: string; // "YYYY-MM-DD"
}
