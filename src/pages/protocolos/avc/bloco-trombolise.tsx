import { useState, useEffect } from "react";
import type { AvcBlocoTrombolise } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, NumericInput, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoTrombolise | null;
  rascunho?: Partial<AvcBlocoTrombolise> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoTrombolise, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  criteriosInclusao: {
    deficitIncapacitante: false, dxCompativel: false, tcSemHemorragia: false, lkwNaJanela: false,
    idade18: false, glicemia60a400: false, paControlada: false, outro: false, outroDesc: "",
  },
  contraindicacoes: {
    hemorragiaIntracraniana: false, tceAvcPrevio3m: false, cirurgiaIntracraniana3m: false, neoplasiaMav: false,
    sangramentoAtivo: false, varfarinaInr: false, plaquetas: false, glicemiaBaixa: false, paPersistente: false,
    endocardite: false, dissecaoAorta: false, outro: false, outroDesc: "",
  },
  tromboliseIndicada: false, motivoNaoTrombolise: "", discussaoNeurologista: false, neurologistaNome: "",
  consentimentoFamiliar: "",
  pesoCalculo: "", doseTotal: "", doseBolus: "", doseInfusao: "",
  bolusHora: "", infusaoInicioHora: "", infusaoTerminoHora: "", doubleCheck: false, intercorrencias: "", paDuranteApos: "",
};

function fromInitial(i: AvcBlocoTrombolise | null, r?: Partial<AvcBlocoTrombolise> | null): State {
  const src = i ?? (r as AvcBlocoTrombolise | null);
  if (!src) return structuredClone(empty);
  return {
    ...empty, ...src,
    criteriosInclusao: { ...empty.criteriosInclusao, ...(src.criteriosInclusao ?? {}) },
    contraindicacoes: { ...empty.contraindicacoes, ...(src.contraindicacoes ?? {}) },
  };
}

/** Dose de Alteplase: 0,9 mg/kg (máx 90) — 10% bolus + 90% infusão de 1h. */
function calcDose(pesoStr: string): { doseTotal: string; doseBolus: string; doseInfusao: string } {
  const peso = Number(String(pesoStr).replace(",", "."));
  if (!peso || Number.isNaN(peso) || peso <= 0) return { doseTotal: "", doseBolus: "", doseInfusao: "" };
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const total = Math.min(round1(0.9 * peso), 90);
  const bolus = round1(total * 0.1);
  const infusao = round1(total - bolus);
  return { doseTotal: String(total), doseBolus: String(bolus), doseInfusao: String(infusao) };
}

const INCLUSAO: { k: keyof State["criteriosInclusao"]; label: string }[] = [
  { k: "deficitIncapacitante", label: "Déficit neurológico incapacitante" },
  { k: "dxCompativel", label: "Diagnóstico clínico compatível com AVC isquêmico" },
  { k: "tcSemHemorragia", label: "TC sem hemorragia (quando disponível)" },
  { k: "lkwNaJanela", label: "LKW dentro da janela terapêutica" },
  { k: "idade18", label: "Idade ≥ 18 anos" },
  { k: "glicemia60a400", label: "Glicemia 60–400 mg/dL (ou hipoglicemia corrigida)" },
  { k: "paControlada", label: "PA controlada ≤ 185/110 mmHg antes da infusão" },
];

const CONTRA: { k: keyof State["contraindicacoes"]; label: string }[] = [
  { k: "hemorragiaIntracraniana", label: "Hemorragia intracraniana na TC" },
  { k: "tceAvcPrevio3m", label: "TCE grave ou AVC prévio nos últimos 3 meses" },
  { k: "cirurgiaIntracraniana3m", label: "Cirurgia intracraniana/raquimedular nos últimos 3 meses" },
  { k: "neoplasiaMav", label: "Neoplasia intracraniana, MAV ou aneurisma de alto risco" },
  { k: "sangramentoAtivo", label: "Sangramento ativo ou diátese hemorrágica relevante" },
  { k: "varfarinaInr", label: "Varfarina com INR > 1,7" },
  { k: "plaquetas", label: "Plaquetas < 100.000/mm³" },
  { k: "glicemiaBaixa", label: "Glicemia < 60 mg/dL não corrigida" },
  { k: "paPersistente", label: "PA persistentemente > 185/110 apesar de tratamento" },
  { k: "endocardite", label: "Endocardite infecciosa ativa" },
  { k: "dissecaoAorta", label: "Suspeita/confirmação de dissecção aguda de aorta" },
];

const CONSENT: [State["consentimentoFamiliar"], string][] = [["sim", "Sim"], ["nao", "Não"], ["na", "N/A"]];

export default function BlocoTromboliseForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setInc = (k: keyof State["criteriosInclusao"], v: boolean | string) =>
    setS((p) => ({ ...p, criteriosInclusao: { ...p.criteriosInclusao, [k]: v } }));
  const setContra = (k: keyof State["contraindicacoes"], v: boolean | string) =>
    setS((p) => ({ ...p, contraindicacoes: { ...p.contraindicacoes, [k]: v } }));
  const setPeso = (v: string) =>
    setS((p) => ({ ...p, pesoCalculo: v, ...calcDose(v) }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (s.tromboliseIndicada) {
    if (!s.pesoCalculo) pendencias.push("Peso para cálculo da dose");
    if (!s.bolusHora) pendencias.push("Hora do bolus");
  } else if (!s.motivoNaoTrombolise.trim()) {
    pendencias.push("Motivo da não-trombólise");
  }
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...s, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Critérios de inclusão</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {INCLUSAO.map(({ k, label }) => (
          <CheckRow key={k} label={label} checked={s.criteriosInclusao[k] as boolean} disabled={ro} onChange={(v) => setInc(k, v)} />
        ))}
        <CheckRow label="Outro" checked={s.criteriosInclusao.outro} disabled={ro} onChange={(v) => setInc("outro", v)} />
      </div>
      {s.criteriosInclusao.outro && (
        <Input label="Qual outro critério?" value={s.criteriosInclusao.outroDesc} readOnly={ro} onChange={(e) => setInc("outroDesc", e.target.value)} />
      )}

      <SectionTitle>Contraindicações absolutas (presença → contraindica)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {CONTRA.map(({ k, label }) => (
          <CheckRow key={k} label={label} checked={s.contraindicacoes[k] as boolean} disabled={ro} onChange={(v) => setContra(k, v)} />
        ))}
        <CheckRow label="Outro" checked={s.contraindicacoes.outro} disabled={ro} onChange={(v) => setContra("outro", v)} />
      </div>
      {s.contraindicacoes.outro && (
        <Input label="Qual outra contraindicação?" value={s.contraindicacoes.outroDesc} readOnly={ro} onChange={(e) => setContra("outroDesc", e.target.value)} />
      )}

      <SectionTitle>Decisão médica</SectionTitle>
      <CheckRow label="Trombólise indicada" checked={s.tromboliseIndicada} disabled={ro} onChange={(v) => set("tromboliseIndicada", v)} />
      {!s.tromboliseIndicada && (
        <Input label={`Motivo da não-trombólise${REQ}`} value={s.motivoNaoTrombolise} readOnly={ro} onChange={(e) => set("motivoNaoTrombolise", e.target.value)} />
      )}
      <div className="grid grid-cols-2 gap-3 items-start">
        <div className="flex flex-col gap-2">
          <CheckRow label="Discussão com neurologista" checked={s.discussaoNeurologista} disabled={ro} onChange={(v) => set("discussaoNeurologista", v)} />
          {s.discussaoNeurologista && (
            <Input label="Nome do neurologista" value={s.neurologistaNome} readOnly={ro} onChange={(e) => set("neurologistaNome", e.target.value)} />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Consentimento/orientação familiar</span>
          <div className="flex flex-wrap gap-2">
            {CONSENT.map(([val, lbl]) => (
              <RadioPill key={val} label={lbl} selected={s.consentimentoFamiliar === val} disabled={ro} onClick={() => set("consentimentoFamiliar", val)} />
            ))}
          </div>
        </div>
      </div>

      {s.tromboliseIndicada && (
        <>
          <SectionTitle>Administração da Alteplase (0,9 mg/kg · máx 90 mg)</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
            <NumericInput label={`Peso p/ cálculo (kg)${REQ}`} value={s.pesoCalculo} readOnly={ro} mode="decimal" decimals={1} max={300} onChange={setPeso} />
            <NumericInput label="Dose total (mg)" value={s.doseTotal} readOnly mode="decimal" decimals={1} onChange={() => {}} hint="0,9 × peso (máx 90)" />
            <NumericInput label="Bolus 10% (mg)" value={s.doseBolus} readOnly mode="decimal" decimals={1} onChange={() => {}} />
            <NumericInput label="Infusão 90% (mg)" value={s.doseInfusao} readOnly mode="decimal" decimals={1} onChange={() => {}} hint="em 1 hora" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
            <TimeInput label={`Hora do bolus${REQ}`} value={s.bolusHora} readOnly={ro} onChange={(v) => set("bolusHora", v)} />
            <TimeInput label="Início da infusão" value={s.infusaoInicioHora} readOnly={ro} onChange={(v) => set("infusaoInicioHora", v)} />
            <TimeInput label="Término da infusão" value={s.infusaoTerminoHora} readOnly={ro} onChange={(v) => set("infusaoTerminoHora", v)} />
          </div>
          <CheckRow label="Double-check médico/enfermagem" checked={s.doubleCheck} disabled={ro} onChange={(v) => set("doubleCheck", v)} />
          <Textarea label="Intercorrências durante a infusão" value={s.intercorrencias} readOnly={ro} rows={2} onChange={(e) => set("intercorrencias", e.target.value)} />
          <Textarea label="PA durante e após a trombólise" value={s.paDuranteApos} readOnly={ro} rows={2} onChange={(e) => set("paDuranteApos", e.target.value)} />
        </>
      )}

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
