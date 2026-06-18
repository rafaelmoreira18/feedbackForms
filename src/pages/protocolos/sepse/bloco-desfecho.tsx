import { useState, useEffect } from "react";
import type { SepseBlocoDesfecho } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, DateField, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: SepseBlocoDesfecho | null;
  rascunho?: Partial<SepseBlocoDesfecho> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
  variante?: string;
}

type State = Omit<SepseBlocoDesfecho, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  criteriosTransferencia: {
    choqueVasopressor: false, lactatoSemClareamento: false, vniVm: false, duasDisfuncoes: false,
    deterioracao: false, alteracaoNeuro: false, glasgowBaixo: false, phoenix2: false,
  },
  utiAcionadaHora: "",
  vagaStatus: "",
  encerramentoTipo: "",
  dxAlternativoDesc: "",
  dataHoraEncerramentoData: "",
  dataHoraEncerramentoHora: "",
  desfecho: "",
};

function fromInitial(i: SepseBlocoDesfecho | null, r?: Partial<SepseBlocoDesfecho> | null): State {
  const src = (i ?? r) as SepseBlocoDesfecho | null;
  if (!src) return structuredClone(empty);
  return { ...structuredClone(empty), ...src } as State;
}

export default function SepseBlocoDesfechoForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly, variante,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const ped = variante === "pediatrico";
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setCrit = (k: keyof State["criteriosTransferencia"], v: boolean) =>
    setS((p) => ({ ...p, criteriosTransferencia: { ...p.criteriosTransferencia, [k]: v } }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s as unknown as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (!s.encerramentoTipo) pendencias.push("Tipo de encerramento");
  if (!s.desfecho) pendencias.push("Desfecho");
  if (s.encerramentoTipo === "dx_alternativo" && !s.dxAlternativoDesc.trim()) pendencias.push("Descrição do diagnóstico alternativo");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...(s as unknown as Record<string, unknown>), responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  const encOpts = [
    ["sepse_confirmada", "Sepse confirmada — alta clínica"],
    ["dx_alternativo", "Diagnóstico alternativo confirmado"],
    ["infeccao_sem_disfuncao", "Infecção sem disfunção"],
    ["fim_de_vida", "Cuidados de fim de vida"],
    ["transferencia", "Transferência"],
  ];
  const desfechoOpts = [
    ["alta", "Alta"], ["obito", "Óbito"], ["transferencia", "Transferência"], ["evento_sentinela", "Evento sentinela"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Critérios de transferência para {ped ? "UTIP" : "UTI"} — acionar se presente</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Choque com necessidade de vasopressor" checked={s.criteriosTransferencia.choqueVasopressor} disabled={ro} onChange={(v) => setCrit("choqueVasopressor", v)} />
        <CheckRow label="Lactato sem clareamento após ressuscitação" checked={s.criteriosTransferencia.lactatoSemClareamento} disabled={ro} onChange={(v) => setCrit("lactatoSemClareamento", v)} />
        <CheckRow label="Necessidade de VNI / ventilação mecânica" checked={s.criteriosTransferencia.vniVm} disabled={ro} onChange={(v) => setCrit("vniVm", v)} />
        <CheckRow label="Duas ou mais disfunções orgânicas" checked={s.criteriosTransferencia.duasDisfuncoes} disabled={ro} onChange={(v) => setCrit("duasDisfuncoes", v)} />
        <CheckRow label="Deterioração clínica progressiva" checked={s.criteriosTransferencia.deterioracao} disabled={ro} onChange={(v) => setCrit("deterioracao", v)} />
        <CheckRow label="Alteração neurológica persistente" checked={s.criteriosTransferencia.alteracaoNeuro} disabled={ro} onChange={(v) => setCrit("alteracaoNeuro", v)} />
        {ped && <CheckRow label="Glasgow ≤ 11" checked={s.criteriosTransferencia.glasgowBaixo} disabled={ro} onChange={(v) => setCrit("glasgowBaixo", v)} />}
        {ped && <CheckRow label="Phoenix Score ≥ 2" checked={s.criteriosTransferencia.phoenix2} disabled={ro} onChange={(v) => setCrit("phoenix2", v)} />}
      </div>
      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label={`${ped ? "UTIP" : "UTI"} acionada (hora)`} value={s.utiAcionadaHora} readOnly={ro} onChange={(v) => set("utiAcionadaHora", v)} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Vaga</span>
          <div className="flex flex-wrap gap-2">
            {[["confirmada", "Confirmada"], ["aguardando", "Aguardando"], ["na", "N/A"]].map(([val, lbl]) => (
              <RadioPill key={val} label={lbl} selected={s.vagaStatus === val} disabled={ro} onClick={() => set("vagaStatus", val)} />
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>Encerramento do protocolo{REQ}</SectionTitle>
      <div className="flex flex-col gap-2">
        {encOpts.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.encerramentoTipo === val} disabled={ro} onClick={() => set("encerramentoTipo", val)} />
        ))}
      </div>
      {s.encerramentoTipo === "dx_alternativo" && (
        <Input label={`Descrever diagnóstico${REQ}`} value={s.dxAlternativoDesc} readOnly={ro} onChange={(e) => set("dxAlternativoDesc", e.target.value)} />
      )}

      <div className="grid grid-cols-2 gap-3 items-start">
        <DateField label="Data do encerramento" value={s.dataHoraEncerramentoData} readOnly={ro} onChange={(v) => set("dataHoraEncerramentoData", v)} />
        <TimeInput label="Hora do encerramento" value={s.dataHoraEncerramentoHora} readOnly={ro} onChange={(v) => set("dataHoraEncerramentoHora", v)} />
      </div>

      <SectionTitle>Desfecho{REQ}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {desfechoOpts.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.desfecho === val} disabled={ro} onClick={() => set("desfecho", val)} />
        ))}
      </div>

      {!ro && mostrarPend && <PendenciasBox pendencias={pendencias} />}

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : draftOnly ? (
        <RascunhoNota />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label={submitLabel} />
      )}
    </div>
  );
}
