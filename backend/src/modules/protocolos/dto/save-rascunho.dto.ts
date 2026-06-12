import { IsObject } from 'class-validator';

/**
 * Rascunho (stand-by) de uma etapa: estado parcial salvo sem fechar a etapa.
 * Aceita um objeto livre (validado por etapa apenas no fechamento). O servidor
 * persiste como JSONB e o devolve ao reabrir o formulário.
 */
export class SaveRascunhoDto {
  @IsObject()
  dados: Record<string, unknown>;
}
