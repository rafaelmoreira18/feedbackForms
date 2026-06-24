import { useState, useEffect } from "react";
import type { AvcBlocoAvaliacao, AvcFastItem } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, NumericInput, DateField, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoAvaliacao | null;
  rascunho?: Partial<AvcBlocoAvaliacao> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoAvaliacao, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  face: "", braco: "", fala: "", tempoRegistrado: false,
  paInicial: "", fc: "", fr: "", spo2: "", temperatura: "", glicemiaCapilar: "", pesoKg: "", glasgow: "", nihssInicial: "",
  anticoagulante: { uso: false, qual: "", ultimaDoseData: "", ultimaDoseHora: "" },
  condutasIniciais: { acessoVenoso: false, coletaExames: false, ecgRealizado: false, o2SeSpo2Baixo: false },
};

function fromInitial(i: AvcBlocoAvaliacao | null, r?: Partial<AvcBlocoAvaliacao> | null): State {
  const src = i ?? (r as AvcBlocoAvaliacao | null);
  if (!src) return structuredClone(empty);
  return {
    face: src.face ?? "", braco: src.braco ?? "", fala: src.fala ?? "", tempoRegistrado: !!src.tempoRegistrado,
    paInicial: src.paInicial ?? "", fc: src.fc ?? "", fr: src.fr ?? "", spo2: src.spo2 ?? "",
    temperatura: src.temperatura ?? "", glicemiaCapilar: src.glicemiaCapilar ?? "", pesoKg: src.pesoKg ?? "",
    glasgow: src.glasgow ?? "", nihssInicial: src.nihssInicial ?? "",
    anticoagulante: { ...empty.anticoagulante, ...(src.anticoagulante ?? {}) },
    condutasIniciais: { ...empty.condutasIniciais, ...(src.condutasIniciais ?? {}) },
  };
}

/** Par de pílulas Normal / Alterado para um item do FAST. */
function FastRow({ label, value, onChange, readOnly }: {
  label: string; value: AvcFastItem; onChange: (v: AvcFastItem) => void; readOnly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm font-sans text-gray-400">{label}</span>
      <div className="flex gap-2">
        <RadioPill label="Normal" selected={value === "normal"} disabled={readOnly} onClick={() => onChange("normal")} />
        <RadioPill label="Alterado" selected={value === "alterado"} disabled={readOnly} onClick={() => onChange("alterado")} />
      </div>
    </div>
  );
}

export default function BlocoAvaliacaoForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setAnti = (k: keyof State["anticoagulante"], v: boolean | string) =>
    setS((p) => ({ ...p, anticoagulante: { ...p.anticoagulante, [k]: v } }));
  const setConduta = (k: keyof State["condutasIniciais"], v: boolean) =>
    setS((p) => ({ ...p, condutasIniciais: { ...p.condutasIniciais, [k]: v } }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (!s.glicemiaCapilar) pendencias.push("Glicemia capilar");
  if (!s.paInicial) pendencias.push("PA inicial");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...s, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>FAST / Cincinnati</SectionTitle>
      <div className="flex flex-col divide-y divide-gray-50">
        <FastRow label="Face" value={s.face} readOnly={ro} onChange={(v) => set("face", v)} />
        <FastRow label="Braço" value={s.braco} readOnly={ro} onChange={(v) => set("braco", v)} />
        <FastRow label="Fala" value={s.fala} readOnly={ro} onChange={(v) => set("fala", v)} />
      </div>
      <CheckRow label="Tempo (início/LKW) registrado" checked={s.tempoRegistrado} disabled={ro} onChange={(v) => set("tempoRegistrado", v)} />

      <SectionTitle>Sinais vitais e dados clínicos</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
        <NumericInput label={`PA inicial${REQ}`} value={s.paInicial} readOnly={ro} mode="bp" onChange={(v) => set("paInicial", v)} placeholder="120/80" />
        <NumericInput label="FC (bpm)" value={s.fc} readOnly={ro} mode="int" max={300} onChange={(v) => set("fc", v)} />
        <NumericInput label="FR (ipm)" value={s.fr} readOnly={ro} mode="int" max={99} onChange={(v) => set("fr", v)} />
        <NumericInput label="SpO₂ (%)" value={s.spo2} readOnly={ro} mode="int" max={100} onChange={(v) => set("spo2", v)} />
        <NumericInput label="Temp. (°C)" value={s.temperatura} readOnly={ro} mode="decimal" decimals={1} max={45} onChange={(v) => set("temperatura", v)} />
        <NumericInput label={`Glicemia (mg/dL)${REQ}`} value={s.glicemiaCapilar} readOnly={ro} mode="int" max={999} onChange={(v) => set("glicemiaCapilar", v)} />
        <NumericInput label="Peso (kg)" value={s.pesoKg} readOnly={ro} mode="decimal" decimals={1} max={300} onChange={(v) => set("pesoKg", v)} hint="usado na dose de alteplase" />
        <NumericInput label="Glasgow" value={s.glasgow} readOnly={ro} mode="int" min={3} max={15} onChange={(v) => set("glasgow", v)} />
        <NumericInput label="NIHSS inicial" value={s.nihssInicial} readOnly={ro} mode="int" min={0} max={42} onChange={(v) => set("nihssInicial", v)} hint="0–42" />
      </div>

      <SectionTitle>Uso de anticoagulante</SectionTitle>
      <CheckRow label="Paciente em uso de anticoagulante" checked={s.anticoagulante.uso} disabled={ro} onChange={(v) => setAnti("uso", v)} />
      {s.anticoagulante.uso && (
        <div className="grid grid-cols-2 gap-3 items-start">
          <Input label="Qual anticoagulante?" value={s.anticoagulante.qual} readOnly={ro} onChange={(e) => setAnti("qual", e.target.value)} />
          <DateField label="Última dose (data)" value={s.anticoagulante.ultimaDoseData} readOnly={ro} onChange={(v) => setAnti("ultimaDoseData", v)} />
          <TimeInput label="Última dose (hora)" value={s.anticoagulante.ultimaDoseHora} readOnly={ro} onChange={(v) => setAnti("ultimaDoseHora", v)} />
        </div>
      )}

      <SectionTitle>Condutas iniciais</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Acesso venoso calibroso realizado" checked={s.condutasIniciais.acessoVenoso} disabled={ro} onChange={(v) => setConduta("acessoVenoso", v)} />
        <CheckRow label="Coleta de exames realizada" checked={s.condutasIniciais.coletaExames} disabled={ro} onChange={(v) => setConduta("coletaExames", v)} />
        <CheckRow label="ECG realizado (sem atrasar trombólise)" checked={s.condutasIniciais.ecgRealizado} disabled={ro} onChange={(v) => setConduta("ecgRealizado", v)} />
        <CheckRow label="O₂ apenas se SpO₂ < 94%" checked={s.condutasIniciais.o2SeSpo2Baixo} disabled={ro} onChange={(v) => setConduta("o2SeSpo2Baixo", v)} />
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
