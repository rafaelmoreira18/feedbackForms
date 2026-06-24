import { useState, useEffect } from "react";
import type { AvcBlocoDesfecho, AvcDiagnosticoFinal, AvcDestino } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import {
  SectionTitle, CheckRow, RadioPill, NumericInput, DateField, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoDesfecho | null;
  rascunho?: Partial<AvcBlocoDesfecho> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoDesfecho, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  diagnosticoFinal: "", diagnosticoOutroDesc: "",
  tratamentoRealizado: { trombolise: false, transferenciaTrombectomia: false, tratamentoClinico: false, neurocirurgia: false },
  destino: "", nihssAlta: "", mrsAlta: "", antiagregacaoAlta: "",
  encaminhamentoAmbulatorial: "", consultaNeuro30d: false, consultaNeuroData: "",
};

function fromInitial(i: AvcBlocoDesfecho | null, r?: Partial<AvcBlocoDesfecho> | null): State {
  const src = i ?? (r as AvcBlocoDesfecho | null);
  if (!src) return structuredClone(empty);
  return { ...empty, ...src, tratamentoRealizado: { ...empty.tratamentoRealizado, ...(src.tratamentoRealizado ?? {}) } };
}

const DIAGNOSTICO: [AvcDiagnosticoFinal, string][] = [
  ["avc_isquemico", "AVC isquêmico"], ["avc_hemorragico", "AVC hemorrágico"], ["ait", "AIT"],
  ["mimics", "Mimics de AVC"], ["outro", "Outro"],
];
const DESTINO: [AvcDestino, string][] = [
  ["alta", "Alta"], ["internacao_enfermaria", "Internação enfermaria"], ["uti", "UTI"],
  ["transferencia", "Transferência"], ["obito", "Óbito"],
];
const ANTIAGREG: [State["antiagregacaoAlta"], string][] = [["sim", "Sim"], ["nao", "Não"], ["na", "N/A"]];

export default function BlocoDesfechoForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setTrat = (k: keyof State["tratamentoRealizado"], v: boolean) =>
    setS((p) => ({ ...p, tratamentoRealizado: { ...p.tratamentoRealizado, [k]: v } }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (!s.diagnosticoFinal) pendencias.push("Diagnóstico final");
  if (s.diagnosticoFinal === "outro" && !s.diagnosticoOutroDesc.trim()) pendencias.push("Descrição do diagnóstico (Outro)");
  if (!s.destino) pendencias.push("Destino do paciente");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...s, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Diagnóstico final{REQ}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {DIAGNOSTICO.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.diagnosticoFinal === val} disabled={ro} onClick={() => set("diagnosticoFinal", val)} />
        ))}
      </div>
      {s.diagnosticoFinal === "outro" && (
        <Input label={`Qual diagnóstico?${REQ}`} value={s.diagnosticoOutroDesc} readOnly={ro} onChange={(e) => set("diagnosticoOutroDesc", e.target.value)} />
      )}

      <SectionTitle>Tratamento realizado</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Trombólise" checked={s.tratamentoRealizado.trombolise} disabled={ro} onChange={(v) => setTrat("trombolise", v)} />
        <CheckRow label="Transferência p/ trombectomia" checked={s.tratamentoRealizado.transferenciaTrombectomia} disabled={ro} onChange={(v) => setTrat("transferenciaTrombectomia", v)} />
        <CheckRow label="Tratamento clínico" checked={s.tratamentoRealizado.tratamentoClinico} disabled={ro} onChange={(v) => setTrat("tratamentoClinico", v)} />
        <CheckRow label="Neurocirurgia / transferência" checked={s.tratamentoRealizado.neurocirurgia} disabled={ro} onChange={(v) => setTrat("neurocirurgia", v)} />
      </div>

      <SectionTitle>Destino{REQ}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {DESTINO.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.destino === val} disabled={ro} onClick={() => set("destino", val)} />
        ))}
      </div>

      <SectionTitle>Escalas na alta / transferência</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
        <NumericInput label="NIHSS na alta" value={s.nihssAlta} readOnly={ro} mode="int" min={0} max={42} onChange={(v) => set("nihssAlta", v)} hint="0–42" />
        <NumericInput label="mRS na alta" value={s.mrsAlta} readOnly={ro} mode="int" min={0} max={6} onChange={(v) => set("mrsAlta", v)} hint="0–6 (Rankin)" />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Antiagregação correta na alta</span>
          <div className="flex flex-wrap gap-2">
            {ANTIAGREG.map(([val, lbl]) => (
              <RadioPill key={val} label={lbl} selected={s.antiagregacaoAlta === val} disabled={ro} onClick={() => set("antiagregacaoAlta", val)} />
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>Encaminhamento ambulatorial</SectionTitle>
      <Textarea label="Encaminhamento" value={s.encaminhamentoAmbulatorial} readOnly={ro} rows={2} onChange={(e) => set("encaminhamentoAmbulatorial", e.target.value)} />
      <div className="grid grid-cols-2 gap-3 items-center">
        <CheckRow label="Consulta neurológica em até 30 dias" checked={s.consultaNeuro30d} disabled={ro} onChange={(v) => set("consultaNeuro30d", v)} />
        {s.consultaNeuro30d && (
          <DateField label="Data agendada" value={s.consultaNeuroData} readOnly={ro} onChange={(v) => set("consultaNeuroData", v)} />
        )}
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
