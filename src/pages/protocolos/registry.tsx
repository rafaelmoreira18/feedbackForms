import type { ComponentType } from "react";
import { HeartPulse, Activity, Brain } from "lucide-react";
// Dor Torácica
import {
  STAGE_META as DT_STAGE_META,
  STAGE_LABEL as DT_STAGE_LABEL,
  STAGE_STYLE as DT_STAGE_STYLE,
  BLOCOS as DT_BLOCOS,
  labelCampo as dtLabelCampo,
  labelValor as dtLabelValor,
} from "./dor-toracica/constants";
import BlocoTriagemForm from "./dor-toracica/bloco-triagem";
import BlocoEcgForm from "./dor-toracica/bloco-ecg";
import BlocoInvestigacaoForm from "./dor-toracica/bloco-investigacao";
import BlocoDesfechoForm from "./dor-toracica/bloco-desfecho";
// Sepse
import {
  SEPSE_STAGES,
  SEPSE_STAGE_META,
  SEPSE_STAGE_LABEL,
  SEPSE_STAGE_STYLE,
  sepseLabelCampo,
  sepseLabelValor,
} from "./sepse/constants";
import BlocoAberturaForm from "./sepse/bloco-abertura";
import BlocoPacote1hForm from "./sepse/bloco-pacote1h";
import BlocoReavaliacaoForm from "./sepse/bloco-reavaliacao";
import SepseBlocoDesfechoForm from "./sepse/bloco-desfecho";
// AVC
import {
  AVC_STAGES,
  AVC_STAGE_META,
  AVC_STAGE_LABEL,
  AVC_STAGE_STYLE,
  avcLabelCampo,
  avcLabelValor,
} from "./avc/constants";
import AvcBlocoAberturaForm from "./avc/bloco-abertura";
import AvcBlocoAvaliacaoForm from "./avc/bloco-avaliacao";
import AvcBlocoImagemForm from "./avc/bloco-imagem";
import AvcBlocoTromboliseForm from "./avc/bloco-trombolise";
import AvcBlocoMonitorizacaoForm from "./avc/bloco-monitorizacao";
import AvcBlocoDesfechoForm from "./avc/bloco-desfecho";

/** Props comuns a todos os formulários de bloco (o conteúdo varia por etapa/tipo). */
export type BlocoFormCommonProps = {
  initial: unknown;
  readOnly: boolean;
  submitLabel?: string;
  submitting: boolean;
  onSubmit: (p: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  rascunho?: unknown;
  onDraftChange?: (d: Record<string, unknown>) => void;
  draftOnly?: boolean;
  /** Variante do protocolo (Sepse: 'adulto' | 'pediatrico'). Ignorada por outros tipos. */
  variante?: string;
  /** Modo padrão de resultado de troponina do tenant (Dor Torácica). Ignorado por outros tipos. */
  troponinaModoPadrao?: 'quantitativo' | 'qualitativo';
};

type BlocoForm = ComponentType<BlocoFormCommonProps>;

export interface StageMeta {
  titulo: string;
  equipe: string;
  registroLabel: string;
}

export interface ProtocoloDef {
  type: string;
  label: string;
  shortLabel: string;
  descricao: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Cor de destaque (classe Tailwind) para o card da home. */
  accent: string;
  /** Etapas preenchíveis, em ordem (exclui `concluido`). */
  stages: string[];
  stageMeta: Record<string, StageMeta>;
  stageLabel: Record<string, string>;
  stageStyle: Record<string, string>;
  blockForm: Record<string, BlocoForm>;
  labelCampo: (path: string) => string;
  labelValor: (v: string) => string;
}

const DOR_TORACICA: ProtocoloDef = {
  type: "dor_toracica",
  label: "Protocolo de Dor Torácica",
  shortLabel: "Dor Torácica",
  descricao: "Síndrome coronariana aguda — triagem, ECG, troponina/HEART e desfecho.",
  icon: HeartPulse,
  accent: "text-red-base",
  stages: [...DT_BLOCOS],
  stageMeta: DT_STAGE_META,
  stageLabel: DT_STAGE_LABEL,
  stageStyle: DT_STAGE_STYLE,
  blockForm: {
    triagem: BlocoTriagemForm as BlocoForm,
    ecg: BlocoEcgForm as BlocoForm,
    investigacao: BlocoInvestigacaoForm as BlocoForm,
    desfecho: BlocoDesfechoForm as BlocoForm,
  },
  labelCampo: dtLabelCampo,
  labelValor: dtLabelValor,
};

const SEPSE: ProtocoloDef = {
  type: "sepse",
  label: "Protocolo de Sepse",
  shortLabel: "Sepse",
  descricao: "Bundle de 1 hora (ILAS/SSC) — abertura, pacote, reavaliação e desfecho. Adulto e pediátrico.",
  icon: Activity,
  accent: "text-aqua-base",
  stages: [...SEPSE_STAGES],
  stageMeta: SEPSE_STAGE_META,
  stageLabel: SEPSE_STAGE_LABEL,
  stageStyle: SEPSE_STAGE_STYLE,
  blockForm: {
    abertura: BlocoAberturaForm as BlocoForm,
    pacote1h: BlocoPacote1hForm as BlocoForm,
    reavaliacao: BlocoReavaliacaoForm as BlocoForm,
    desfecho: SepseBlocoDesfechoForm as BlocoForm,
  },
  labelCampo: sepseLabelCampo,
  labelValor: sepseLabelValor,
};

const AVC: ProtocoloDef = {
  type: "avc",
  label: "Protocolo de AVC",
  shortLabel: "AVC",
  descricao: "Linha de Cuidado do AVC — marcos (FMC/LKW), FAST, imagem, trombólise e desfecho.",
  icon: Brain,
  accent: "text-purple-base",
  stages: [...AVC_STAGES],
  stageMeta: AVC_STAGE_META,
  stageLabel: AVC_STAGE_LABEL,
  stageStyle: AVC_STAGE_STYLE,
  blockForm: {
    abertura: AvcBlocoAberturaForm as BlocoForm,
    avaliacao: AvcBlocoAvaliacaoForm as BlocoForm,
    imagem: AvcBlocoImagemForm as BlocoForm,
    trombolise: AvcBlocoTromboliseForm as BlocoForm,
    monitorizacao: AvcBlocoMonitorizacaoForm as BlocoForm,
    desfecho: AvcBlocoDesfechoForm as BlocoForm,
  },
  labelCampo: avcLabelCampo,
  labelValor: avcLabelValor,
};

const DEFS: Record<string, ProtocoloDef> = {
  dor_toracica: DOR_TORACICA,
  sepse: SEPSE,
  avc: AVC,
};

/** Todos os protocolos disponíveis (ordem dos cards na home). */
export const ALL_PROTOCOLOS: ProtocoloDef[] = [DOR_TORACICA, SEPSE, AVC];

/** Definição de um tipo (fallback Dor Torácica para compatibilidade). */
export function getProtocoloDef(type: string | undefined): ProtocoloDef {
  return (type && DEFS[type]) || DOR_TORACICA;
}

/** Mapa etapa → índice (inclui `concluido` ao final). */
export function stageOrder(def: ProtocoloDef): Record<string, number> {
  const order: Record<string, number> = {};
  def.stages.forEach((s, i) => (order[s] = i));
  order.concluido = def.stages.length;
  return order;
}
