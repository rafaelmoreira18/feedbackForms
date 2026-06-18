import { BadRequestException } from '@nestjs/common';
import type { ProtocoloEntity } from './entities/protocolo.entity';
import { computeDorToracicaMetrics } from './metrics/dor-toracica.metrics';
import { computeSepseMetrics } from './metrics/sepse.metrics';
import type { ProtocoloMetrics } from './metrics/metrics.types';

/** Metadados de uma etapa preenchível de um protocolo. */
export interface StageDef {
  key: string;
  titulo: string;
  equipe: string;
  registroLabel: string;
}

/**
 * Definição declarativa de um tipo de protocolo — fonte única da ORDEM das etapas,
 * da validação por etapa e da estratégia de métricas. Adicionar um novo protocolo =
 * adicionar uma definição aqui (+ tipos dos blocos e forms no frontend).
 */
export interface ProtocoloDefinition {
  type: string;
  label: string;
  /** Etapas preenchíveis, em ordem. A conclusão (`concluido`) é implícita após a última. */
  stages: StageDef[];
  /** Estratégia de métricas/indicadores do dashboard. */
  metrics: (protocolos: ProtocoloEntity[]) => ProtocoloMetrics;
  /**
   * Validação específica por etapa no fechamento/edição (lança BadRequest).
   * `ctx.variante` permite regras que dependem da variante (Sepse adulto/pediátrico).
   */
  validateBloco?: (
    stageKey: string,
    dto: Record<string, unknown>,
    ctx?: { variante?: string },
  ) => void;
}

const DOR_TORACICA: ProtocoloDefinition = {
  type: 'dor_toracica',
  label: 'Protocolo de Dor Torácica',
  stages: [
    { key: 'triagem', titulo: 'Triagem', equipe: 'Equipe de Enfermagem', registroLabel: 'COREN' },
    { key: 'ecg', titulo: 'ECG', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
    { key: 'investigacao', titulo: 'Investigação', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
    { key: 'desfecho', titulo: 'Desfecho', equipe: 'Médico', registroLabel: 'CRM' },
  ],
  metrics: computeDorToracicaMetrics,
  validateBloco: (stageKey, dto) => {
    if (stageKey === 'triagem') {
      const q = (dto as { queixaPrincipal?: Record<string, boolean> }).queixaPrincipal;
      const alguma =
        !!q && (q.dorToracica || q.dispneiaSubita || q.sudoreseNauseaSincope || q.dorIrradiada);
      if (!alguma) {
        throw new BadRequestException(
          'Marque ao menos uma queixa principal antes de fechar a triagem.',
        );
      }
    }
  },
};

const SEPSE: ProtocoloDefinition = {
  type: 'sepse',
  label: 'Protocolo de Sepse',
  stages: [
    { key: 'abertura', titulo: 'Abertura', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
    { key: 'pacote1h', titulo: 'Pacote de 1 hora', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
    { key: 'reavaliacao', titulo: 'Reavaliação', equipe: 'Enfermagem / Médico', registroLabel: 'COREN / CRM' },
    { key: 'desfecho', titulo: 'Desfecho', equipe: 'Médico', registroLabel: 'CRM' },
  ],
  metrics: computeSepseMetrics,
  validateBloco: (stageKey, dto, ctx) => {
    if (stageKey === 'abertura') {
      if (!dto.horarioZeroHora) {
        throw new BadRequestException(
          'Informe a hora do horário zero antes de fechar a abertura.',
        );
      }
      if (!dto.classificacao) {
        throw new BadRequestException(
          'Selecione a classificação antes de fechar a abertura.',
        );
      }
      // Pediátrico: SIRS exige temperatura OU leucócitos (espelha a validação do formulário).
      if (ctx?.variante === 'pediatrico') {
        const sirs = (dto as { sirsPediatrica?: Record<string, boolean> }).sirsPediatrica;
        if (!sirs?.temperatura && !sirs?.leucocitose) {
          throw new BadRequestException(
            'SIRS pediátrica: marque temperatura ou leucócitos antes de fechar a abertura.',
          );
        }
      }
    }
  },
};

const DEFINITIONS: Record<string, ProtocoloDefinition> = {
  dor_toracica: DOR_TORACICA,
  sepse: SEPSE,
};

/** Tipos de protocolo válidos. */
export const PROTOCOL_TYPES = Object.keys(DEFINITIONS);

export function getDefinition(type: string): ProtocoloDefinition {
  const def = DEFINITIONS[type];
  if (!def) throw new BadRequestException(`Tipo de protocolo inválido: ${type}`);
  return def;
}

/** Primeira etapa (estado inicial de `currentStage`). */
export function firstStage(def: ProtocoloDefinition): string {
  return def.stages[0].key;
}

export function isValidStage(def: ProtocoloDefinition, stageKey: string): boolean {
  return def.stages.some((s) => s.key === stageKey);
}
