import { useState } from "react";
import type { BlocoTriagem } from "@/types";
import type { SubmitTriagemPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import { SectionTitle, CheckRow, RadioPill, DateField, EtapaFechadaInfo, FecharEtapaBar, NumericInput } from "./form-ui";

interface Props {
  initial: BlocoTriagem | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitTriagemPayload) => void;
  responsavel: { nome: string; registro: string };
}

const empty = {
  inicioTriagem: "",
  classificacaoManchester: "" as BlocoTriagem["classificacaoManchester"],
  paMsd: "", paMse: "", fc: "", fr: "", spo2: "", tax: "", glicemia: "",
  dorToracica: false, dispneiaSubita: false, sudoreseNauseaSincope: false, dorIrradiada: false,
  inicioSintomasData: "", inicioSintomasHora: "",
  alergias: false, alergiasDescricao: "", instabilidade: false,
  primeiroEcgHora: "", interpretacaoMedicaHora: "",
  resultadoEcg: "" as BlocoTriagem["resultadoEcg"],
  v3rV4r: false, v7v9: false, ecgSeriado: false,
};

function fromInitial(i: BlocoTriagem | null): typeof empty {
  if (!i) return { ...empty };
  return {
    inicioTriagem: i.inicioTriagem, classificacaoManchester: i.classificacaoManchester,
    paMsd: i.sinaisVitais.paMsd, paMse: i.sinaisVitais.paMse, fc: i.sinaisVitais.fc,
    fr: i.sinaisVitais.fr, spo2: i.sinaisVitais.spo2, tax: i.sinaisVitais.tax, glicemia: i.sinaisVitais.glicemia,
    dorToracica: i.queixaPrincipal.dorToracica, dispneiaSubita: i.queixaPrincipal.dispneiaSubita,
    sudoreseNauseaSincope: i.queixaPrincipal.sudoreseNauseaSincope, dorIrradiada: i.queixaPrincipal.dorIrradiada,
    inicioSintomasData: i.inicioSintomasData, inicioSintomasHora: i.inicioSintomasHora,
    alergias: i.alergias, alergiasDescricao: i.alergiasDescricao, instabilidade: i.instabilidade,
    primeiroEcgHora: i.primeiroEcgHora, interpretacaoMedicaHora: i.interpretacaoMedicaHora,
    resultadoEcg: i.resultadoEcg,
    v3rV4r: i.derivacoesExtras.v3rV4r, v7v9: i.derivacoesExtras.v7v9, ecgSeriado: i.derivacoesExtras.ecgSeriado,
  };
}

export default function BlocoTriagemForm({ initial, readOnly, submitting, onSubmit, responsavel }: Props) {
  const [s, setS] = useState(() => fromInitial(initial));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  const handleSubmit = () => {
    onSubmit({
      inicioTriagem: s.inicioTriagem,
      classificacaoManchester: s.classificacaoManchester,
      sinaisVitais: { paMsd: s.paMsd, paMse: s.paMse, fc: s.fc, fr: s.fr, spo2: s.spo2, tax: s.tax, glicemia: s.glicemia },
      queixaPrincipal: {
        dorToracica: s.dorToracica, dispneiaSubita: s.dispneiaSubita,
        sudoreseNauseaSincope: s.sudoreseNauseaSincope, dorIrradiada: s.dorIrradiada,
      },
      inicioSintomasData: s.inicioSintomasData,
      inicioSintomasHora: s.inicioSintomasHora,
      alergias: s.alergias,
      alergiasDescricao: s.alergiasDescricao,
      instabilidade: s.instabilidade,
      primeiroEcgHora: s.primeiroEcgHora,
      interpretacaoMedicaHora: s.interpretacaoMedicaHora,
      resultadoEcg: s.resultadoEcg,
      derivacoesExtras: { v3rV4r: s.v3rV4r, v7v9: s.v7v9, ecgSeriado: s.ecgSeriado },
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 1 — Triagem (Enfermagem)</SectionTitle>

      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label="Início triagem" value={s.inicioTriagem} readOnly={ro} onChange={(v) => set("inicioTriagem", v)} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Classificação Manchester</span>
          <div className="flex gap-2">
            <RadioPill label="Vermelho" selected={s.classificacaoManchester === "vermelho"} disabled={ro} onClick={() => set("classificacaoManchester", "vermelho")} />
            <RadioPill label="Laranja" selected={s.classificacaoManchester === "laranja"} disabled={ro} onClick={() => set("classificacaoManchester", "laranja")} />
          </div>
        </div>
      </div>

      <SectionTitle>Sinais vitais na admissão</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumericInput label="PA MSD" placeholder="120/80" mode="bp" value={s.paMsd} readOnly={ro} onChange={(v) => set("paMsd", v)} />
        <NumericInput label="PA MSE" placeholder="120/80" mode="bp" value={s.paMse} readOnly={ro} onChange={(v) => set("paMse", v)} />
        <NumericInput label="FC (bpm)" mode="int" value={s.fc} readOnly={ro} onChange={(v) => set("fc", v)} />
        <NumericInput label="FR (ipm)" mode="int" value={s.fr} readOnly={ro} onChange={(v) => set("fr", v)} />
        <NumericInput label="SpO₂ (%)" mode="int" value={s.spo2} readOnly={ro} onChange={(v) => set("spo2", v)} />
        <NumericInput label="Tax (°C)" mode="decimal" value={s.tax} readOnly={ro} onChange={(v) => set("tax", v)} />
        <NumericInput label="Glicemia (mg/dL)" mode="int" value={s.glicemia} readOnly={ro} onChange={(v) => set("glicemia", v)} />
      </div>

      <SectionTitle>Queixa principal</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Dor / desconforto torácico" checked={s.dorToracica} disabled={ro} onChange={(v) => set("dorToracica", v)} />
        <CheckRow label="Dispneia súbita" checked={s.dispneiaSubita} disabled={ro} onChange={(v) => set("dispneiaSubita", v)} />
        <CheckRow label="Sudorese / náusea / síncope" checked={s.sudoreseNauseaSincope} disabled={ro} onChange={(v) => set("sudoreseNauseaSincope", v)} />
        <CheckRow label="Dor em braço, mandíbula, epigástrio" checked={s.dorIrradiada} disabled={ro} onChange={(v) => set("dorIrradiada", v)} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-start">
        <DateField label="Início dos sintomas (data)" value={s.inicioSintomasData} readOnly={ro} onChange={(v) => set("inicioSintomasData", v)} />
        <TimeInput label="Início dos sintomas (hora)" value={s.inicioSintomasHora} readOnly={ro} onChange={(v) => set("inicioSintomasHora", v)} />
      </div>
      <div className="flex flex-col gap-2">
        <CheckRow label="Alergias" checked={s.alergias} disabled={ro} onChange={(v) => set("alergias", v)} />
        {s.alergias && (
          <Input label="Quais alergias?" value={s.alergiasDescricao} readOnly={ro} onChange={(e) => set("alergiasDescricao", e.target.value)} />
        )}
        <CheckRow label="⚠ Instabilidade? (se SIM → Sala Vermelha imediata)" checked={s.instabilidade} disabled={ro} onChange={(v) => set("instabilidade", v)} />
      </div>

      <SectionTitle>Etapa 2 — Eletrocardiograma (ECG)</SectionTitle>
      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label="1º ECG realizado" value={s.primeiroEcgHora} readOnly={ro} onChange={(v) => set("primeiroEcgHora", v)} />
        <TimeInput label="Interpretação médica" value={s.interpretacaoMedicaHora} readOnly={ro} onChange={(v) => set("interpretacaoMedicaHora", v)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Resultado do ECG</span>
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

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
