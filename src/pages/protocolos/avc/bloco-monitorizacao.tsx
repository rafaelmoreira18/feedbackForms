import { useState, useEffect } from "react";
import type { AvcBlocoMonitorizacao, AvcMonitorLinha } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import TimeInput from "@/components/ui/time-input";
import Button from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  SectionTitle, CheckRow, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoMonitorizacao | null;
  rascunho?: Partial<AvcBlocoMonitorizacao> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoMonitorizacao, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const emptyRow = (): AvcMonitorLinha => ({ hora: "", nihss: "", pa: "", glicemia: "", temp: "" });

const empty: State = {
  serie: [],
  deterioracaoNeurologica: false, suspeitaSangramento: false, tcControleRealizada: false, tcControleHora: "",
  condutaComplicacoes: "",
  fess: {
    degluticao24h: false, fessFebre: false, fessGlicemia: false, fessDegluticao: false,
    fisioterapia: false, fonoaudiologia: false, profilaxiaTvp: false, antiagregacao: false,
  },
};

function fromInitial(i: AvcBlocoMonitorizacao | null, r?: Partial<AvcBlocoMonitorizacao> | null): State {
  const src = i ?? (r as AvcBlocoMonitorizacao | null);
  if (!src) return { ...structuredClone(empty), serie: [emptyRow(), emptyRow(), emptyRow()] };
  const serie = Array.isArray(src.serie) && src.serie.length > 0 ? src.serie.map((l) => ({ ...emptyRow(), ...l })) : [emptyRow()];
  return { ...empty, ...src, serie, fess: { ...empty.fess, ...(src.fess ?? {}) } };
}

const FESS: { k: keyof State["fess"]; label: string }[] = [
  { k: "degluticao24h", label: "Avaliação de deglutição em até 24h" },
  { k: "fessFebre", label: "FeSS — Febre controlada" },
  { k: "fessGlicemia", label: "FeSS — Glicemia controlada" },
  { k: "fessDegluticao", label: "FeSS — Deglutição avaliada antes de dieta VO" },
  { k: "fisioterapia", label: "Fisioterapia acionada" },
  { k: "fonoaudiologia", label: "Fonoaudiologia acionada" },
  { k: "profilaxiaTvp", label: "Profilaxia de TVP avaliada" },
  { k: "antiagregacao", label: "Antiagregação/anticoagulação conforme diagnóstico" },
];

export default function BlocoMonitorizacaoForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setFess = (k: keyof State["fess"], v: boolean) => setS((p) => ({ ...p, fess: { ...p.fess, [k]: v } }));
  const setRow = (idx: number, k: keyof AvcMonitorLinha, v: string) =>
    setS((p) => ({ ...p, serie: p.serie.map((l, i) => (i === idx ? { ...l, [k]: v } : l)) }));
  const addRow = () => setS((p) => ({ ...p, serie: [...p.serie, emptyRow()] }));
  const removeRow = (idx: number) => setS((p) => ({ ...p, serie: p.serie.filter((_, i) => i !== idx) }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const handleSubmit = () =>
    onSubmit({
      ...s,
      // descarta linhas totalmente vazias ao fechar
      serie: s.serie.filter((l) => l.hora || l.nihss || l.pa || l.glicemia || l.temp),
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });

  const rowsToShow = ro ? s.serie.filter((l) => l.hora || l.nihss || l.pa || l.glicemia || l.temp) : s.serie;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Monitorização seriada</SectionTitle>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1.5fr_0.7fr_1fr_1fr_0.9fr_auto] gap-2 px-1">
          {["Horário", "NIHSS", "PA", "Glicemia", "Temp.", ""].map((h, i) => (
            <span key={i} className="text-[11px] font-semibold uppercase tracking-wider text-teal-dark font-sans">{h}</span>
          ))}
        </div>
        {rowsToShow.length === 0 && (
          <span className="text-sm text-gray-300 font-sans px-1">Sem registros.</span>
        )}
        {rowsToShow.map((l, idx) => (
          <div key={idx} className="grid grid-cols-[1.5fr_0.7fr_1fr_1fr_0.9fr_auto] gap-2 items-center">
            <TimeInput value={l.hora} readOnly={ro} onChange={(v) => setRow(idx, "hora", v)} />
            <Input value={l.nihss} readOnly={ro} placeholder="0–42" inputMode="numeric" onChange={(e) => setRow(idx, "nihss", e.target.value.replace(/[^\d]/g, ""))} />
            <Input value={l.pa} readOnly={ro} placeholder="120/80" onChange={(e) => setRow(idx, "pa", e.target.value)} />
            <Input value={l.glicemia} readOnly={ro} placeholder="mg/dL" inputMode="numeric" onChange={(e) => setRow(idx, "glicemia", e.target.value.replace(/[^\d]/g, ""))} />
            <Input value={l.temp} readOnly={ro} placeholder="°C" inputMode="decimal" onChange={(e) => setRow(idx, "temp", e.target.value)} />
            {ro ? <span /> : (
              <button type="button" onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-base p-1" title="Remover linha">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {!ro && (
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addRow}>
            <Plus size={16} /> Adicionar linha
          </Button>
        )}
      </div>

      <SectionTitle>Vigilância de complicações</SectionTitle>
      <CheckRow label="Sinais de deterioração neurológica (↑ ≥4 NIHSS / rebaixamento / cefaleia / pico hipertensivo)" checked={s.deterioracaoNeurologica} disabled={ro} onChange={(v) => set("deterioracaoNeurologica", v)} />
      <CheckRow label="Suspeita de sangramento (→ pausar alteplase, TC urgente, coagulograma)" checked={s.suspeitaSangramento} disabled={ro} onChange={(v) => set("suspeitaSangramento", v)} />
      <div className="grid grid-cols-2 gap-3 items-center">
        <CheckRow label="TC de controle realizada (24h ou se piora)" checked={s.tcControleRealizada} disabled={ro} onChange={(v) => set("tcControleRealizada", v)} />
        {s.tcControleRealizada && (
          <TimeInput label="Hora da TC de controle" value={s.tcControleHora} readOnly={ro} onChange={(v) => set("tcControleHora", v)} />
        )}
      </div>
      <Textarea label="Conduta em complicações" value={s.condutaComplicacoes} readOnly={ro} rows={2} onChange={(e) => set("condutaComplicacoes", e.target.value)} />

      <SectionTitle>Cuidados integrais nas primeiras 24h (FeSS + multiprofissional)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {FESS.map(({ k, label }) => (
          <CheckRow key={k} label={label} checked={s.fess[k]} disabled={ro} onChange={(v) => setFess(k, v)} />
        ))}
      </div>

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
