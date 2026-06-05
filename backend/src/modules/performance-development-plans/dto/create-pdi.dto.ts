import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Cria um PDI a partir de uma avaliação concluída. O cabeçalho
 * (colaborador, setor, cargo, etc.) é copiado da avaliação no service.
 */
export class CreatePdiDto {
  @IsString()
  @IsNotEmpty()
  evaluationSlug: string;
}
