import { useState, useEffect } from "react";
import type { SepseBlocoPacote1h } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota, NumericInput,
} from "../form/form-ui";

interface Props {
  initial: SepseBlocoPacote1h | null;
  rascunho?: Partial<SepseBlocoPacote1h> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
  variante?: string;
}

type State = Omit<SepseBlocoPacote1h, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  lactato: { feito: false, hora: "", valor: "" },
  hemoculturas: { feito: false, hora: "" },
  culturasFoco: { feito: false, hora: "", foco: "" },
  antimicrobiano: { hora1aDose: "" },
  reposicaoVolemica: { indicada: false, naoIndicada: false, hora: "", mlTotal: "" },
  vasopressor: { indicado: false, naoIndicado: false, hora: "", via: "", dose: "" },
  passo1Acesso: { abcde: false, o2Ofertado: false, acessoVenoso: false, acessoIO: false, ioLocal: "" },
  passo2Coletas: {
    lactato: { feito: false, hora: "", valor: "" },
    hemoculturas: { feito: false, hora: "" },
    kitSepse: { feito: false, hora: "" },
    glicemia: { feito: false, hora: "", valor: "" },
    calcioIonizado: { feito: false, hora: "", valor: "" },
  },
  passo3Atm: { doseCalculadaMg: "", hora1aDose: "", via: "", atmPrevio: false },
  passo4Volume: {
    bolus1: { ml: "", hora: "", tecPos: "", estertores: false },
    bolus2: { ml: "", hora: "", tecPos: "", estertores: false },
  },
  passo5Vasoativo: { tipoChoque: "", droga: "", doseInicial: "", hora: "", via: "" },
};

function fromInitial(i: SepseBlocoPacote1h | null, r?: Partial<SepseBlocoPacote1h> | null): State {
  const src = (i ?? r) as SepseBlocoPacote1h | null;
  if (!src) return structuredClone(empty);
  return { ...structuredClone(empty), ...src } as State;
}

export default function BlocoPacote1hForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly, variante,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const ped = variante === "pediatrico";

  // Atualizador aninhado (1–2 níveis).
  const setG = <G extends keyof State, K extends keyof State[G]>(g: G, k: K, v: State[G][K]) =>
    setS((p) => ({ ...p, [g]: { ...(p[g] as object), [k]: v } }));
  const setColeta = (
    g: "passo2Coletas",
    field: "lactato" | "hemoculturas" | "kitSepse" | "glicemia" | "calcioIonizado",
    patch: Record<string, unknown>,
  ) => setS((p) => ({ ...p, [g]: { ...p[g], [field]: { ...(p[g][field] as object), ...patch } } }));
  const setBolus = (which: "bolus1" | "bolus2", patch: Record<string, unknown>) =>
    setS((p) => ({ ...p, passo4Volume: { ...p.passo4Volume, [which]: { ...p.passo4Volume[which], ...patch } } }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s as unknown as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const handleSubmit = () =>
    onSubmit({ ...(s as unknown as Record<string, unknown>), responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });

  const FecharOuLeitura = ro ? (
    <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
  ) : draftOnly ? (
    <RascunhoNota />
  ) : (
    <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label={submitLabel} />
  );

  if (ped) {
    return (
      <div className="flex flex-col gap-4">
        <SectionTitle>Passo 1 — Acesso e monitorização (≤ 5–15 min)</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <CheckRow label="ABCDE avaliado + monitorização" checked={s.passo1Acesso.abcde} disabled={ro} onChange={(v) => setG("passo1Acesso", "abcde", v)} />
          <CheckRow label="O₂ ofertado (meta SpO₂ ≥ 92%)" checked={s.passo1Acesso.o2Ofertado} disabled={ro} onChange={(v) => setG("passo1Acesso", "o2Ofertado", v)} />
          <CheckRow label="Acesso venoso periférico" checked={s.passo1Acesso.acessoVenoso} disabled={ro} onChange={(v) => setG("passo1Acesso", "acessoVenoso", v)} />
          <CheckRow label="Acesso intraósseo (IO)" checked={s.passo1Acesso.acessoIO} disabled={ro} onChange={(v) => setG("passo1Acesso", "acessoIO", v)} />
        </div>
        {s.passo1Acesso.acessoIO && (
          <Input label="Local do IO" value={s.passo1Acesso.ioLocal} readOnly={ro} onChange={(e) => setG("passo1Acesso", "ioLocal", e.target.value)} />
        )}

        <SectionTitle>Passo 2 — Coletas (≤ 15 min)</SectionTitle>
        <ColetaRow label="Lactato" feito={s.passo2Coletas.lactato.feito} hora={s.passo2Coletas.lactato.hora} valor={s.passo2Coletas.lactato.valor} unidade="mmol/L" ro={ro}
          onFeito={(v) => setColeta("passo2Coletas", "lactato", { feito: v })} onHora={(v) => setColeta("passo2Coletas", "lactato", { hora: v })} onValor={(v) => setColeta("passo2Coletas", "lactato", { valor: v })} />
        <ColetaRow label="Hemoculturas (antes do ATM)" feito={s.passo2Coletas.hemoculturas.feito} hora={s.passo2Coletas.hemoculturas.hora} ro={ro}
          onFeito={(v) => setColeta("passo2Coletas", "hemoculturas", { feito: v })} onHora={(v) => setColeta("passo2Coletas", "hemoculturas", { hora: v })} />
        <ColetaRow label="Kit sepse (gaso/hemograma/creat/bili/coag)" feito={s.passo2Coletas.kitSepse.feito} hora={s.passo2Coletas.kitSepse.hora} ro={ro}
          onFeito={(v) => setColeta("passo2Coletas", "kitSepse", { feito: v })} onHora={(v) => setColeta("passo2Coletas", "kitSepse", { hora: v })} />
        <ColetaRow label="Glicemia capilar (<60 corrigir)" feito={s.passo2Coletas.glicemia.feito} hora={s.passo2Coletas.glicemia.hora} valor={s.passo2Coletas.glicemia.valor} unidade="mg/dL" ro={ro}
          onFeito={(v) => setColeta("passo2Coletas", "glicemia", { feito: v })} onHora={(v) => setColeta("passo2Coletas", "glicemia", { hora: v })} onValor={(v) => setColeta("passo2Coletas", "glicemia", { valor: v })} />
        <ColetaRow label="Cálcio iônico" feito={s.passo2Coletas.calcioIonizado.feito} hora={s.passo2Coletas.calcioIonizado.hora} valor={s.passo2Coletas.calcioIonizado.valor} unidade="mmol/L" ro={ro}
          onFeito={(v) => setColeta("passo2Coletas", "calcioIonizado", { feito: v })} onHora={(v) => setColeta("passo2Coletas", "calcioIonizado", { hora: v })} onValor={(v) => setColeta("passo2Coletas", "calcioIonizado", { valor: v })} />

        <SectionTitle>Passo 3 — Antimicrobiano (≤ 60 min no choque)</SectionTitle>
        <div className="grid grid-cols-2 gap-3 items-start">
          <NumericInput label="Dose calculada (mg)" mode="int" value={s.passo3Atm.doseCalculadaMg} readOnly={ro} onChange={(v) => setG("passo3Atm", "doseCalculadaMg", v)} hint="Pip-tazo 100 mg/kg" />
          <TimeInput label="1ª dose (hora)" value={s.passo3Atm.hora1aDose} readOnly={ro} onChange={(v) => setG("passo3Atm", "hora1aDose", v)} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {[["periferico", "Periférico"], ["io", "IO"], ["central", "Central"]].map(([val, lbl]) => (
            <RadioPill key={val} label={lbl} selected={s.passo3Atm.via === val} disabled={ro} onClick={() => setG("passo3Atm", "via", val)} />
          ))}
          <CheckRow label="ATM em uso prévio" checked={s.passo3Atm.atmPrevio} disabled={ro} onChange={(v) => setG("passo3Atm", "atmPrevio", v)} />
        </div>

        <SectionTitle>Passo 4 — Ressuscitação volêmica (20 mL/kg RL)</SectionTitle>
        <BolusRow which="1º bolus" ml={s.passo4Volume.bolus1.ml} hora={s.passo4Volume.bolus1.hora} tecPos={s.passo4Volume.bolus1.tecPos} estertores={s.passo4Volume.bolus1.estertores} ro={ro}
          onMl={(v) => setBolus("bolus1", { ml: v })} onHora={(v) => setBolus("bolus1", { hora: v })} onTec={(v) => setBolus("bolus1", { tecPos: v })} onEst={(v) => setBolus("bolus1", { estertores: v })} />
        <BolusRow which="2º bolus" ml={s.passo4Volume.bolus2.ml} hora={s.passo4Volume.bolus2.hora} tecPos={s.passo4Volume.bolus2.tecPos} estertores={s.passo4Volume.bolus2.estertores} ro={ro}
          onMl={(v) => setBolus("bolus2", { ml: v })} onHora={(v) => setBolus("bolus2", { hora: v })} onTec={(v) => setBolus("bolus2", { tecPos: v })} onEst={(v) => setBolus("bolus2", { estertores: v })} />

        <SectionTitle>Passo 5 — Vasoativo (choque refratário a fluidos)</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <RadioPill label="Choque frio → Adrenalina" selected={s.passo5Vasoativo.tipoChoque === "frio"} disabled={ro} onClick={() => setS((p) => ({ ...p, passo5Vasoativo: { ...p.passo5Vasoativo, tipoChoque: "frio", droga: "adrenalina" } }))} />
          <RadioPill label="Choque quente → Noradrenalina" selected={s.passo5Vasoativo.tipoChoque === "quente"} disabled={ro} onClick={() => setS((p) => ({ ...p, passo5Vasoativo: { ...p.passo5Vasoativo, tipoChoque: "quente", droga: "noradrenalina" } }))} />
        </div>
        <div className="grid grid-cols-2 gap-3 items-start">
          <Input label="Dose inicial (mcg/kg/min)" value={s.passo5Vasoativo.doseInicial} readOnly={ro} onChange={(e) => setG("passo5Vasoativo", "doseInicial", e.target.value)} />
          <TimeInput label="Hora" value={s.passo5Vasoativo.hora} readOnly={ro} onChange={(v) => setG("passo5Vasoativo", "hora", v)} />
        </div>

        {FecharOuLeitura}
      </div>
    );
  }

  // ── Adulto ──
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Pacote de 1 hora — todos os itens elegíveis em ≤ 60 min</SectionTitle>
      <ColetaRow label="Lactato (resultado ≤ 30 min)" feito={s.lactato.feito} hora={s.lactato.hora} valor={s.lactato.valor} unidade="mmol/L" ro={ro}
        onFeito={(v) => setG("lactato", "feito", v)} onHora={(v) => setG("lactato", "hora", v)} onValor={(v) => setG("lactato", "valor", v)} />
      <ColetaRow label="Hemoculturas (2 sítios — antes do ATM)" feito={s.hemoculturas.feito} hora={s.hemoculturas.hora} ro={ro}
        onFeito={(v) => setG("hemoculturas", "feito", v)} onHora={(v) => setG("hemoculturas", "hora", v)} />
      <ColetaRow label="Culturas de foco" feito={s.culturasFoco.feito} hora={s.culturasFoco.hora} ro={ro}
        onFeito={(v) => setG("culturasFoco", "feito", v)} onHora={(v) => setG("culturasFoco", "hora", v)} />
      {s.culturasFoco.feito && (
        <Input label="Foco da cultura" value={s.culturasFoco.foco} readOnly={ro} onChange={(e) => setG("culturasFoco", "foco", e.target.value)} />
      )}

      <SectionTitle>Antimicrobiano — 1ª dose plena em ≤ 60 min</SectionTitle>
      <TimeInput label="1ª dose (hora)" value={s.antimicrobiano.hora1aDose} readOnly={ro} onChange={(v) => setG("antimicrobiano", "hora1aDose", v)} />

      <SectionTitle>Reposição volêmica — Ringer Lactato 30 mL/kg</SectionTitle>
      <div className="flex flex-wrap gap-2 items-center">
        <RadioPill label="Indicada" selected={s.reposicaoVolemica.indicada} disabled={ro} onClick={() => setS((p) => ({ ...p, reposicaoVolemica: { ...p.reposicaoVolemica, indicada: true, naoIndicada: false } }))} />
        <RadioPill label="Não indicada" selected={s.reposicaoVolemica.naoIndicada} disabled={ro} onClick={() => setS((p) => ({ ...p, reposicaoVolemica: { ...p.reposicaoVolemica, indicada: false, naoIndicada: true } }))} />
      </div>
      {s.reposicaoVolemica.indicada && (
        <div className="grid grid-cols-2 gap-3 items-start">
          <TimeInput label="Hora" value={s.reposicaoVolemica.hora} readOnly={ro} onChange={(v) => setG("reposicaoVolemica", "hora", v)} />
          <NumericInput label="Volume total (mL)" mode="int" value={s.reposicaoVolemica.mlTotal} readOnly={ro} onChange={(v) => setG("reposicaoVolemica", "mlTotal", v)} />
        </div>
      )}

      <SectionTitle>Vasopressor — noradrenalina se PAM &lt; 65</SectionTitle>
      <div className="flex flex-wrap gap-2 items-center">
        <RadioPill label="Indicado" selected={s.vasopressor.indicado} disabled={ro} onClick={() => setS((p) => ({ ...p, vasopressor: { ...p.vasopressor, indicado: true, naoIndicado: false } }))} />
        <RadioPill label="Não indicado" selected={s.vasopressor.naoIndicado} disabled={ro} onClick={() => setS((p) => ({ ...p, vasopressor: { ...p.vasopressor, indicado: false, naoIndicado: true } }))} />
      </div>
      {s.vasopressor.indicado && (
        <div className="grid grid-cols-3 gap-3 items-start">
          <Input label="Dose (mcg/kg/min)" value={s.vasopressor.dose} readOnly={ro} onChange={(e) => setG("vasopressor", "dose", e.target.value)} />
          <TimeInput label="Hora" value={s.vasopressor.hora} readOnly={ro} onChange={(v) => setG("vasopressor", "hora", v)} />
          <Input label="Via" value={s.vasopressor.via} readOnly={ro} onChange={(e) => setG("vasopressor", "via", e.target.value)} />
        </div>
      )}

      {FecharOuLeitura}
    </div>
  );
}

function ColetaRow({
  label, feito, hora, valor, unidade, ro, onFeito, onHora, onValor,
}: {
  label: string; feito: boolean; hora: string; valor?: string; unidade?: string; ro: boolean;
  onFeito: (v: boolean) => void; onHora: (v: string) => void; onValor?: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-t border-gray-50 pt-2">
      <div className="sm:col-span-5"><CheckRow label={label} checked={feito} disabled={ro} onChange={onFeito} /></div>
      <div className="sm:col-span-3"><TimeInput label="Hora" value={hora} readOnly={ro} onChange={onHora} /></div>
      {onValor && (
        <div className="sm:col-span-4">
          <NumericInput label={`Valor${unidade ? ` (${unidade})` : ""}`} mode="decimal" value={valor ?? ""} readOnly={ro} onChange={onValor} />
        </div>
      )}
    </div>
  );
}

function BolusRow({
  which, ml, hora, tecPos, estertores, ro, onMl, onHora, onTec, onEst,
}: {
  which: string; ml: string; hora: string; tecPos: string; estertores: boolean; ro: boolean;
  onMl: (v: string) => void; onHora: (v: string) => void; onTec: (v: string) => void; onEst: (v: boolean) => void;
}) {
  return (
    <div className="border-t border-gray-50 pt-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">{which}</span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end mt-1">
        <NumericInput label="mL" mode="int" value={ml} readOnly={ro} onChange={onMl} />
        <TimeInput label="Hora" value={hora} readOnly={ro} onChange={onHora} />
        <NumericInput label="TEC pós (s)" mode="int" value={tecPos} readOnly={ro} onChange={onTec} />
        <div className="flex items-end"><CheckRow label="Estertores?" checked={estertores} disabled={ro} onChange={onEst} /></div>
      </div>
    </div>
  );
}
