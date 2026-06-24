import { IsOptional, IsString, IsIn } from 'class-validator';
import { PROTOCOL_TYPES } from '../protocolo-definitions';

export class FilterProtocoloDto {
  /** Tipo de protocolo registrado (dor_toracica | sepse | avc). Default nas métricas: dor_toracica. */
  @IsOptional()
  @IsIn(PROTOCOL_TYPES)
  protocolType?: string;

  /**
   * Filtra por etapa corrente. "abertos" = todos != concluido. As etapas variam por
   * tipo de protocolo (ver protocolo-definitions.ts), por isso aceita string livre.
   */
  @IsOptional()
  @IsString()
  stage?: string;

  /** Janela de datas (dataAtendimento) — usada nas métricas/dashboard */
  @IsOptional()
  @IsString()
  startDate?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsString()
  endDate?: string; // "YYYY-MM-DD"
}
