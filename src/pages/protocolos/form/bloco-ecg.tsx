import { useState, useEffect } from "react";
import type { BlocoEcg } from "@/types";
import type { SubmitEcgPayload } from "@/services/protocolo-service";
import TimeInput from "@/components/ui/time-input";
import { SectionTitle, CheckRow, RadioPill, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota, PendenciasBox, REQ } from "./form-ui";

interface Props {
  initial: BlocoEcg | null;
  rascunho?: Partial<BlocoEcg> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitEcgPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  /** Etapa adiantada (futura): salva rascunho, mas não exibe o botão de fechar. */
  draftOnly?: boolean;
}

const empty = {
  primeiroEcgHora: "",
  interpretacaoMedicaHora: "",
  resultadoEcg: "" as BlocoEcg["resultadoEcg"],
  v3rV4r: false, v7v9: false, ecgSeriado: false,
};

function fromInitial(i: BlocoEcg | null, r?: Partial<BlocoEcg> | null): typeof empty {
  const src = i ?? (r as BlocoEcg | null);
  if (!src) return { ...empty };
  const d = src.derivacoesExtras ?? ({} as BlocoEcg["derivacoesExtras"]);
  return {
    primeiroEcgHora: src.primeiroEcgHora ?? "",
    interpretacaoMedicaHora: src.interpretacaoMedicaHora ?? "",
    resultadoEcg: src.resultadoEcg ?? "",
    v3rV4r: !!d.v3rV4r, v7v9: !!d.v7v9, ecgSeriado: !!d.ecgSeriado,
  };
}

function toPayloadBase(s: typeof empty) {
  return {
    primeiroEcgHora: s.primeiroEcgHora,
    interpretacaoMedicaHora: s.interpretacaoMedicaHora,
    resultadoEcg: s.resultadoEcg,
    derivacoesExtras: { v3rV4r: s.v3rV4r, v7v9: s.v7v9, ecgSeriado: s.ecgSeriado },
  };
}

export default function BlocoEcgForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState(() => fromInitial(initial, rascunho));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  const [mostrarPend, setMostrarPend] = useState(false);

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(toPayloadBase(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (!s.primeiroEcgHora) pendencias.push("1º ECG realizado");
  if (!s.interpretacaoMedicaHora) pendencias.push("Interpretação médica");
  if (!s.resultadoEcg) pendencias.push("Resultado do ECG (VIA)");

  const handleSubmit = () => {
    if (pendencias.length > 0) {
      setMostrarPend(true);
      return;
    }
    onSubmit({
      ...toPayloadBase(s),
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 2 — Eletrocardiograma (ECG)</SectionTitle>
      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label={`1º ECG realizado${REQ}`} value={s.primeiroEcgHora} readOnly={ro} onChange={(v) => set("primeiroEcgHora", v)} />
        <TimeInput label={`Interpretação médica${REQ}`} value={s.interpretacaoMedicaHora} readOnly={ro} onChange={(v) => set("interpretacaoMedicaHora", v)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Resultado do ECG{REQ}</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <RadioPill label="VIA I — Supra de ST" selected={s.resultadoEcg === "via_i"} disabled={ro} onClick={() => set("resultadoEcg", "via_i")} />
          <RadioPill label="VIA II — Isquemia s/ supra" selected={s.resultadoEcg === "via_ii"} disabled={ro} onClick={() => set("resultadoEcg", "via_ii")} />
          <RadioPill label="VIA III — Normal / não diag." selected={s.resultadoEcg === "via_iii"} disabled={ro} onClick={() => set("resultadoEcg", "via_iii")} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <CheckRow label="V3R / V4R" checked={s.v3rV4r} disabled={ro} onChange={(v) => set("v3rV4r", v)} />
        <CheckRow label="V7–V9" checked={s.v7v9} disabled={ro} onChange={(v) => set("v7v9", v)} />
        <CheckRow label="ECG seriado" checked={s.ecgSeriado} disabled={ro} onChange={(v) => set("ecgSeriado", v)} />
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
