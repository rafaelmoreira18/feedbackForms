import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CriteriosReperfusaoDto {
  @IsOptional() @IsBoolean() resolucaoSt50: boolean = false;
  @IsOptional() @IsBoolean() eva3: boolean = false;
  @IsOptional() @IsBoolean() arritmiaReperfusao: boolean = false;
}

class MedidasAdmissaoDto {
  @IsOptional() @IsBoolean() aas: boolean = false;
  @IsOptional() @IsBoolean() p2y12: boolean = false;
  @IsOptional() @IsBoolean() anticoagulante: boolean = false;
  @IsOptional() @IsBoolean() monitorizacao: boolean = false;
  @IsOptional() @IsBoolean() o2: boolean = false;
}

class PrescricoesAltaDto {
  @IsOptional() @IsBoolean() aas: boolean = false;
  @IsOptional() @IsBoolean() p2y12: boolean = false;
  @IsOptional() @IsBoolean() estatina: boolean = false;
  @IsOptional() @IsBoolean() betabloqueador: boolean = false;
  @IsOptional() @IsBoolean() iecaBra: boolean = false;
}

class AltaSeguraCriteriosDto {
  @IsOptional() @IsBoolean() heart3TropNeg: boolean = false;
  @IsOptional() @IsBoolean() ecgSemIsquemia: boolean = false;
  @IsOptional() @IsBoolean() semInstabilidade: boolean = false;
  @IsOptional() @IsBoolean() daaTepAfastados: boolean = false;
  @IsOptional() @IsBoolean() seguimentoAgendado: boolean = false;
  @IsOptional() @IsBoolean() orientacoesEntregues: boolean = false;
}

export class SubmitBlocoDesfechoDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do responsável é obrigatório' })
  @MaxLength(160)
  responsavelNome: string;

  @IsString()
  @IsNotEmpty({ message: 'Registro profissional (CRM) é obrigatório' })
  @MaxLength(40)
  registroProfissional: string;

  // ETAPA 5 — Trombólise (VIA I)
  @IsOptional() @IsBoolean() trombolitiseElegivel: boolean = false;
  @IsOptional() @IsString() @MaxLength(300) trombolitiseMotivoNao: string = '';
  @IsOptional() @IsString() @MaxLength(5) inicioFibrinolitico: string = '';
  @IsOptional() @IsString() @MaxLength(10) tempoPortaAgulhaMin: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriosReperfusaoDto)
  criteriosReperfusao?: CriteriosReperfusaoDto;

  @IsOptional() @IsIn(['sucesso', 'falha', '']) eficaciaTrombolise: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => MedidasAdmissaoDto)
  medidasAdmissao?: MedidasAdmissaoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescricoesAltaDto)
  prescricoesAlta?: PrescricoesAltaDto;

  // ETAPA 6 — Encaminhamento final
  @IsOptional()
  @IsIn([
    'alta_ambulatorial',
    'observacao',
    'internacao_uti',
    'transferencia_icp',
    'transferencia_uti_referencia',
    'obito',
    '',
  ])
  destino: string = '';

  @IsOptional() @IsString() @MaxLength(10) obitoData: string = '';
  @IsOptional() @IsString() @MaxLength(5) obitoHora: string = '';
  @IsOptional() @IsString() @MaxLength(5) solicitacaoRegulacaoHora: string = '';
  @IsOptional() @IsString() @MaxLength(5) confirmacaoVagaHora: string = '';
  @IsOptional() @IsString() @MaxLength(5) saidaEfetivaHora: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => AltaSeguraCriteriosDto)
  altaSeguraCriterios?: AltaSeguraCriteriosDto;

  // Assinaturas
  @IsOptional() @IsString() @MaxLength(200) enfermeiroNomeCoren: string = '';
  @IsOptional() @IsString() @MaxLength(200) medicoNomeCrm: string = '';
}
