import { useState, useEffect } from "react";
import type { BlocoTriagem } from "@/types";
import type { SubmitTriagemPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, DateField, EtapaFechadaInfo, FecharEtapaBar,
  NumericInput, isBpValido, PendenciasBox, REQ,
} from "./form-ui";

interface Props {
  initial: BlocoTriagem | null;
  /** Rascunho salvo (stand-by) — usado quando a etapa ainda está em aberto. */
  rascunho?: Partial<BlocoTriagem> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitTriagemPayload) => void;
  /** Notifica o pai a cada alteração para auto-save do rascunho. */
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  /** Rótulo do botão de salvar (ex.: "Salvar alterações" no modo edição). */
  submitLabel?: string;
}

const empty = {
  inicioTriagem: "",
  classificacaoManchester: "" as BlocoTriagem["classificacaoManchester"],
  paMsd: "", paMse: "", fc: "", fr: "", spo2: "", tax: "", glicemia: "",
  dorToracica: false, dispneiaSubita: false, sudoreseNauseaSincope: false, dorIrradiada: false,
  inicioSintomasData: "", inicioSintomasHora: "",
  alergias: false, alergiasDescricao: "", instabilidade: false,
};

function fromInitial(i: BlocoTriagem | null, r?: Partial<BlocoTriagem> | null): typeof empty {
  // Etapa fechada → usa o salvo; etapa aberta → usa o rascunho (stand-by) se houver.
  const src = i ?? (r as BlocoTriagem | null);
  if (!src) return { ...empty };
  const sv = src.sinaisVitais ?? ({} as BlocoTriagem["sinaisVitais"]);
  const q = src.queixaPrincipal ?? ({} as BlocoTriagem["queixaPrincipal"]);
  return {
    inicioTriagem: src.inicioTriagem ?? "", classificacaoManchester: src.classificacaoManchester ?? "",
    paMsd: sv.paMsd ?? "", paMse: sv.paMse ?? "", fc: sv.fc ?? "",
    fr: sv.fr ?? "", spo2: sv.spo2 ?? "", tax: sv.tax ?? "", glicemia: sv.glicemia ?? "",
    dorToracica: !!q.dorToracica, dispneiaSubita: !!q.dispneiaSubita,
    sudoreseNauseaSincope: !!q.sudoreseNauseaSincope, dorIrradiada: !!q.dorIrradiada,
    inicioSintomasData: src.inicioSintomasData ?? "", inicioSintomasHora: src.inicioSintomasHora ?? "",
    alergias: !!src.alergias, alergiasDescricao: src.alergiasDescricao ?? "", instabilidade: !!src.instabilidade,
  };
}

/** Converte o estado plano em payload aninhado (sinaisVitais / queixaPrincipal). */
function toPayloadBase(s: typeof empty) {
  return {
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
  };
}

export default function BlocoTriagemForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel,
}: Props) {
  const [s, setS] = useState(() => fromInitial(initial, rascunho));
  const [erro, setErro] = useState("");
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  // Auto-save do rascunho (stand-by) sempre que o estado muda — só em modo edição.
  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(toPayloadBase(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const algumaQueixa = s.dorToracica || s.dispneiaSubita || s.sudoreseNauseaSincope || s.dorIrradiada;

  // Campos obrigatórios da triagem (quadrado amarelo do documento) que estão vazios.
  const pendencias: string[] = [];
  if (!s.inicioTriagem) pendencias.push("Início da triagem");
  if (!s.classificacaoManchester) pendencias.push("Classificação Manchester");
  if (!s.paMsd) pendencias.push("PA MSD");
  if (!s.paMse) pendencias.push("PA MSE");
  if (!s.fc) pendencias.push("FC");
  if (!s.fr) pendencias.push("FR");
  if (!s.spo2) pendencias.push("SpO₂");
  if (!s.tax) pendencias.push("Tax");
  if (!s.glicemia) pendencias.push("Glicemia");
  if (!algumaQueixa) pendencias.push("Queixa principal (ao menos 1)");
  if (!s.inicioSintomasData) pendencias.push("Início dos sintomas (data)");
  if (!s.inicioSintomasHora) pendencias.push("Início dos sintomas (hora)");
  if (s.alergias && !s.alergiasDescricao.trim()) pendencias.push("Quais alergias");

  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) {
      setMostrarPend(true);
      setErro("");
      return;
    }
    if (!isBpValido(s.paMsd) || !isBpValido(s.paMse)) {
      setErro("Pressão arterial fora da faixa válida. Use o formato sist/diast (ex.: 120/80).");
      return;
    }
    setErro("");
    onSubmit({
      ...toPayloadBase(s),
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 1 — Triagem (Enfermagem)</SectionTitle>

      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label={`Início triagem${REQ}`} value={s.inicioTriagem} readOnly={ro} onChange={(v) => set("inicioTriagem", v)} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Classificação Manchester{REQ}</span>
          <div className="flex gap-2">
            <RadioPill label="Vermelho" selected={s.classificacaoManchester === "vermelho"} disabled={ro} onClick={() => set("classificacaoManchester", "vermelho")} />
            <RadioPill label="Laranja" selected={s.classificacaoManchester === "laranja"} disabled={ro} onClick={() => set("classificacaoManchester", "laranja")} />
          </div>
        </div>
      </div>

      <SectionTitle>Sinais vitais na admissão</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumericInput label={`PA MSD${REQ}`} placeholder="120/80" mode="bp" value={s.paMsd} readOnly={ro} onChange={(v) => set("paMsd", v)} hint="sist/diast" />
        <NumericInput label={`PA MSE${REQ}`} placeholder="120/80" mode="bp" value={s.paMse} readOnly={ro} onChange={(v) => set("paMse", v)} hint="sist/diast" />
        <NumericInput label={`FC (bpm)${REQ}`} placeholder="80" mode="int" min={20} max={300} value={s.fc} readOnly={ro} onChange={(v) => set("fc", v)} hint="20–300" />
        <NumericInput label={`FR (ipm)${REQ}`} placeholder="16" mode="int" min={5} max={99} value={s.fr} readOnly={ro} onChange={(v) => set("fr", v)} hint="5–99" />
        <NumericInput label={`SpO₂ (%)${REQ}`} placeholder="98" mode="int" min={0} max={100} value={s.spo2} readOnly={ro} onChange={(v) => set("spo2", v)} hint="0–100" />
        <NumericInput label={`Tax (°C)${REQ}`} placeholder="36.5" mode="decimal" min={25} max={45} value={s.tax} readOnly={ro} onChange={(v) => set("tax", v)} hint="25–45" />
        <NumericInput label={`Glicemia (mg/dL)${REQ}`} placeholder="100" mode="int" min={10} max={1500} value={s.glicemia} readOnly={ro} onChange={(v) => set("glicemia", v)} hint="10–1500" />
      </div>

      <SectionTitle>Queixa principal (marque ao menos 1)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Dor / desconforto torácico" checked={s.dorToracica} disabled={ro} onChange={(v) => set("dorToracica", v)} />
        <CheckRow label="Dispneia súbita" checked={s.dispneiaSubita} disabled={ro} onChange={(v) => set("dispneiaSubita", v)} />
        <CheckRow label="Sudorese / náusea / síncope" checked={s.sudoreseNauseaSincope} disabled={ro} onChange={(v) => set("sudoreseNauseaSincope", v)} />
        <CheckRow label="Dor em braço, mandíbula, epigástrio" checked={s.dorIrradiada} disabled={ro} onChange={(v) => set("dorIrradiada", v)} />
      </div>
      {!ro && !algumaQueixa && (
        <span className="text-[11px] text-amber-600 font-sans -mt-2">Selecione ao menos uma queixa.</span>
      )}
      <div className="grid grid-cols-2 gap-3 items-start">
        <DateField label={`Início dos sintomas (data)${REQ}`} value={s.inicioSintomasData} readOnly={ro} onChange={(v) => set("inicioSintomasData", v)} />
        <TimeInput label={`Início dos sintomas (hora)${REQ}`} value={s.inicioSintomasHora} readOnly={ro} onChange={(v) => set("inicioSintomasHora", v)} />
      </div>
      <div className="flex flex-col gap-2">
        <CheckRow label="Alergias" checked={s.alergias} disabled={ro} onChange={(v) => set("alergias", v)} />
        {s.alergias && (
          <Input label={`Quais alergias?${REQ}`} value={s.alergiasDescricao} readOnly={ro} onChange={(e) => set("alergiasDescricao", e.target.value)} />
        )}
        <CheckRow label="⚠ Instabilidade? (se SIM → Sala Vermelha imediata)" checked={s.instabilidade} disabled={ro} onChange={(v) => set("instabilidade", v)} />
      </div>

      {!ro && mostrarPend && <PendenciasBox pendencias={pendencias} />}
      {erro && <span className="text-sm text-red-base font-sans">{erro}</span>}

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label={submitLabel} />
      )}
    </div>
  );
}
