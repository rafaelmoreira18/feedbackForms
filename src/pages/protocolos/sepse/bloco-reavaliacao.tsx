import { useState, useEffect, useMemo } from "react";
import type { SepseBlocoReavaliacao, SepseMetaReav } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import TimeInput from "@/components/ui/time-input";
import Select from "@/components/ui/select";
import {
  SectionTitle, RadioPill, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota, NumericInput,
} from "../form/form-ui";

interface Props {
  initial: SepseBlocoReavaliacao | null;
  rascunho?: Partial<SepseBlocoReavaliacao> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
  variante?: string;
}

type State = Omit<SepseBlocoReavaliacao, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const m = (): SepseMetaReav => ({ valor: "", metaAtingida: "" });
const empty: State = {
  reav6h: { pam: m(), tec: m(), diurese: m(), spo2: m(), consciencia: m(), glicemia: m() },
  phoenix: { respiratorio: 0, cardiovascularVasoativo: 0, cardiovascularLactato: 0, coagulacao: 0, neurologico: 0, total: 0, classificacao: "" },
  reav1a2h: { tec: m(), diurese: m(), pas: m(), consciencia: m(), spo2: m() },
  recoletaLactato: { hora: "", valor: "", clareamento: "" },
};

function fromInitial(i: SepseBlocoReavaliacao | null, r?: Partial<SepseBlocoReavaliacao> | null): State {
  const src = (i ?? r) as SepseBlocoReavaliacao | null;
  if (!src) return structuredClone(empty);
  return { ...structuredClone(empty), ...src } as State;
}

export default function BlocoReavaliacaoForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly, variante,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const ped = variante === "pediatrico";

  const setMeta = (group: "reav6h" | "reav1a2h", key: string, patch: Partial<SepseMetaReav>) =>
    setS((p) => ({ ...p, [group]: { ...p[group], [key]: { ...(p[group] as Record<string, SepseMetaReav>)[key], ...patch } } }));
  const setPhoenix = (key: keyof State["phoenix"], v: number) =>
    setS((p) => ({ ...p, phoenix: { ...p.phoenix, [key]: v } }));
  const setRecoleta = (patch: Record<string, string>) =>
    setS((p) => ({ ...p, recoletaLactato: { ...p.recoletaLactato, ...patch } }));

  // Total e classificação Phoenix derivados automaticamente.
  const phoenixTotal = useMemo(
    () => s.phoenix.respiratorio + s.phoenix.cardiovascularVasoativo + s.phoenix.cardiovascularLactato + s.phoenix.coagulacao + s.phoenix.neurologico,
    [s.phoenix],
  );
  const phoenixClass = useMemo(() => {
    if (phoenixTotal < 2) return "incompleto";
    const cardio = s.phoenix.cardiovascularVasoativo + s.phoenix.cardiovascularLactato;
    return cardio >= 1 ? "choque_septico" : "sepse";
  }, [phoenixTotal, s.phoenix]);

  useEffect(() => {
    if (ro || !onDraftChange) return;
    const payload = { ...s, phoenix: { ...s.phoenix, total: phoenixTotal, classificacao: phoenixClass } };
    onDraftChange(payload as unknown as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, phoenixTotal, phoenixClass]);

  const handleSubmit = () =>
    onSubmit({
      ...(s as unknown as Record<string, unknown>),
      phoenix: { ...s.phoenix, total: phoenixTotal, classificacao: phoenixClass },
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });

  const FecharOuLeitura = ro ? (
    <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
  ) : draftOnly ? (
    <RascunhoNota />
  ) : (
    <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label={submitLabel} />
  );

  const phoenixOpts = (max: number) =>
    Array.from({ length: max + 1 }, (_, i) => ({ value: String(i), label: `${i} ponto${i === 1 ? "" : "s"}` }));

  return (
    <div className="flex flex-col gap-4">
      {ped ? (
        <>
          <SectionTitle>Phoenix Sepsis Score 2024 (≥ 2 = sepse · +cardiovascular = choque)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Respiratório" options={phoenixOpts(3)} value={String(s.phoenix.respiratorio)} disabled={ro} onChange={(e) => setPhoenix("respiratorio", Number(e.target.value))} />
            <Select label="Cardiovascular — vasoativo" options={phoenixOpts(2)} value={String(s.phoenix.cardiovascularVasoativo)} disabled={ro} onChange={(e) => setPhoenix("cardiovascularVasoativo", Number(e.target.value))} />
            <Select label="Cardiovascular — lactato" options={phoenixOpts(2)} value={String(s.phoenix.cardiovascularLactato)} disabled={ro} onChange={(e) => setPhoenix("cardiovascularLactato", Number(e.target.value))} />
            <Select label="Coagulação" options={phoenixOpts(2)} value={String(s.phoenix.coagulacao)} disabled={ro} onChange={(e) => setPhoenix("coagulacao", Number(e.target.value))} />
            <Select label="Neurológico" options={phoenixOpts(2)} value={String(s.phoenix.neurologico)} disabled={ro} onChange={(e) => setPhoenix("neurologico", Number(e.target.value))} />
          </div>
          <div className="rounded-xl bg-teal-light/50 px-4 py-2 text-sm font-sans text-teal-dark">
            Total Phoenix: <b>{phoenixTotal}</b> · {phoenixClass === "choque_septico" ? "Choque séptico" : phoenixClass === "sepse" ? "Sepse" : "Dados incompletos (< 2)"}
          </div>

          <SectionTitle>Reavaliação seriada — a cada 1–2 horas</SectionTitle>
          <MetaRow label="TEC (≤ 2 s)" meta={s.reav1a2h.tec} ro={ro} onChange={(p) => setMeta("reav1a2h", "tec", p)} />
          <MetaRow label="Diurese (≥ 1 mL/kg/h)" meta={s.reav1a2h.diurese} ro={ro} onChange={(p) => setMeta("reav1a2h", "diurese", p)} />
          <MetaRow label="PAS para a faixa etária" meta={s.reav1a2h.pas} ro={ro} onChange={(p) => setMeta("reav1a2h", "pas", p)} />
          <MetaRow label="Nível de consciência / GCS" meta={s.reav1a2h.consciencia} ro={ro} onChange={(p) => setMeta("reav1a2h", "consciencia", p)} />
          <MetaRow label="SpO₂ (≥ 92%)" meta={s.reav1a2h.spo2} ro={ro} onChange={(p) => setMeta("reav1a2h", "spo2", p)} />
        </>
      ) : (
        <>
          <SectionTitle>Reavaliação seriada — primeiras 6 horas</SectionTitle>
          <MetaRow label="PAM (≥ 65 mmHg)" meta={s.reav6h.pam} ro={ro} onChange={(p) => setMeta("reav6h", "pam", p)} />
          <MetaRow label="TEC (≤ 3 s)" meta={s.reav6h.tec} ro={ro} onChange={(p) => setMeta("reav6h", "tec", p)} />
          <MetaRow label="Diurese (≥ 0,5 mL/kg/h)" meta={s.reav6h.diurese} ro={ro} onChange={(p) => setMeta("reav6h", "diurese", p)} />
          <MetaRow label="SpO₂ (92–96%)" meta={s.reav6h.spo2} ro={ro} onChange={(p) => setMeta("reav6h", "spo2", p)} />
          <MetaRow label="Nível de consciência" meta={s.reav6h.consciencia} ro={ro} onChange={(p) => setMeta("reav6h", "consciencia", p)} />
          <MetaRow label="Glicemia (140–180 mg/dL)" meta={s.reav6h.glicemia} ro={ro} onChange={(p) => setMeta("reav6h", "glicemia", p)} />
        </>
      )}

      <SectionTitle>Recoleta de lactato em 2–4h (se elevado)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <TimeInput label="Hora" value={s.recoletaLactato.hora} readOnly={ro} onChange={(v) => setRecoleta({ hora: v })} />
        <NumericInput label="Valor (mmol/L)" mode="decimal" value={s.recoletaLactato.valor} readOnly={ro} onChange={(v) => setRecoleta({ valor: v })} />
        {!ped && (
          <NumericInput label="Clareamento (%)" mode="int" value={s.recoletaLactato.clareamento} readOnly={ro} onChange={(v) => setRecoleta({ clareamento: v })} hint="meta ≥ 20%" />
        )}
      </div>

      {FecharOuLeitura}
    </div>
  );
}

function MetaRow({
  label, meta, ro, onChange,
}: {
  label: string; meta: SepseMetaReav; ro: boolean; onChange: (patch: Partial<SepseMetaReav>) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-t border-gray-50 pt-2">
      <div className="sm:col-span-6 flex items-end">
        <span className="text-sm font-sans text-gray-400">{label}</span>
      </div>
      <div className="sm:col-span-3">
        <NumericInput label="Valor" mode="decimal" value={meta.valor} readOnly={ro} onChange={(v) => onChange({ valor: v })} />
      </div>
      <div className="sm:col-span-3 flex gap-2 items-end pb-1">
        <RadioPill label="Sim" selected={meta.metaAtingida === "sim"} disabled={ro} onClick={() => onChange({ metaAtingida: "sim" })} />
        <RadioPill label="Não" selected={meta.metaAtingida === "nao"} disabled={ro} onClick={() => onChange({ metaAtingida: "nao" })} />
      </div>
    </div>
  );
}
