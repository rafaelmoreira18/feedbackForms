import { useState, useEffect } from "react";
import type { SepseBlocoAbertura } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, DateField, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: SepseBlocoAbertura | null;
  rascunho?: Partial<SepseBlocoAbertura> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
  variante?: string;
}

const empty = {
  horarioZeroData: "", horarioZeroHora: "",
  pulmonar: false, urinario: false, abdominal: false, peleMoles: false, snc: false,
  cateter: false, endocardite: false, naoDefinido: false, outro: false, outroDesc: "",
  classificacao: "",
  criterioInfeccaoDisfuncao: false, criterioSirs2: false,
  hemodinamico: false, renal: false, respiratorio: false, hematologico: false,
  metabolico: false, neurologico: false, hepatico: false, coagulopatia: false,
  temperatura: false, taquicardia: false, taquipneia: false, leucocitose: false,
  tecLento: false, perfusaoFlash: false, alteracaoMental: false, oliguria: false, hipotensao: false,
};

function fromInitial(i: SepseBlocoAbertura | null, r?: Partial<SepseBlocoAbertura> | null): typeof empty {
  const src = i ?? (r as SepseBlocoAbertura | null);
  if (!src) return { ...empty };
  const f = src.focoPrincipal ?? ({} as SepseBlocoAbertura["focoPrincipal"]);
  const d = src.disfuncoesOrganicas ?? ({} as SepseBlocoAbertura["disfuncoesOrganicas"]);
  const s = src.sirsPediatrica ?? ({} as SepseBlocoAbertura["sirsPediatrica"]);
  const h = src.sinaisHipoperfusao ?? ({} as SepseBlocoAbertura["sinaisHipoperfusao"]);
  return {
    horarioZeroData: src.horarioZeroData ?? "", horarioZeroHora: src.horarioZeroHora ?? "",
    pulmonar: !!f.pulmonar, urinario: !!f.urinario, abdominal: !!f.abdominal, peleMoles: !!f.peleMoles,
    snc: !!f.snc, cateter: !!f.cateter, endocardite: !!f.endocardite, naoDefinido: !!f.naoDefinido,
    outro: !!f.outro, outroDesc: f.outroDesc ?? "",
    classificacao: src.classificacao ?? "",
    criterioInfeccaoDisfuncao: !!src.criterioInfeccaoDisfuncao, criterioSirs2: !!src.criterioSirs2,
    hemodinamico: !!d.hemodinamico, renal: !!d.renal, respiratorio: !!d.respiratorio, hematologico: !!d.hematologico,
    metabolico: !!d.metabolico, neurologico: !!d.neurologico, hepatico: !!d.hepatico, coagulopatia: !!d.coagulopatia,
    temperatura: !!s.temperatura, taquicardia: !!s.taquicardia, taquipneia: !!s.taquipneia, leucocitose: !!s.leucocitose,
    tecLento: !!h.tecLento, perfusaoFlash: !!h.perfusaoFlash, alteracaoMental: !!h.alteracaoMental,
    oliguria: !!h.oliguria, hipotensao: !!h.hipotensao,
  };
}

function toPayloadBase(s: typeof empty) {
  return {
    horarioZeroData: s.horarioZeroData,
    horarioZeroHora: s.horarioZeroHora,
    focoPrincipal: {
      pulmonar: s.pulmonar, urinario: s.urinario, abdominal: s.abdominal, peleMoles: s.peleMoles,
      snc: s.snc, cateter: s.cateter, endocardite: s.endocardite, naoDefinido: s.naoDefinido,
      outro: s.outro, outroDesc: s.outroDesc,
    },
    classificacao: s.classificacao,
    criterioInfeccaoDisfuncao: s.criterioInfeccaoDisfuncao,
    criterioSirs2: s.criterioSirs2,
    disfuncoesOrganicas: {
      hemodinamico: s.hemodinamico, renal: s.renal, respiratorio: s.respiratorio, hematologico: s.hematologico,
      metabolico: s.metabolico, neurologico: s.neurologico, hepatico: s.hepatico, coagulopatia: s.coagulopatia,
    },
    sirsPediatrica: {
      temperatura: s.temperatura, taquicardia: s.taquicardia, taquipneia: s.taquipneia, leucocitose: s.leucocitose,
    },
    sinaisHipoperfusao: {
      tecLento: s.tecLento, perfusaoFlash: s.perfusaoFlash, alteracaoMental: s.alteracaoMental,
      oliguria: s.oliguria, hipotensao: s.hipotensao,
    },
  };
}

export default function BlocoAberturaForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly, variante,
}: Props) {
  const [s, setS] = useState(() => fromInitial(initial, rascunho));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;
  const ped = variante === "pediatrico";

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(toPayloadBase(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const classificacaoOpts = ped
    ? [["sepse", "Sepse"], ["sepse_grave", "Sepse grave"], ["choque_septico", "Choque séptico"]]
    : [["sepse", "Sepse"], ["choque_septico", "Choque séptico"], ["infeccao_sem_disfuncao", "Infecção sem disfunção"]];

  const pendencias: string[] = [];
  if (!s.horarioZeroHora) pendencias.push("Horário zero (hora)");
  if (!s.classificacao) pendencias.push("Classificação");
  if (ped && !s.temperatura && !s.leucocitose) pendencias.push("SIRS pediátrica (temperatura ou leucócitos)");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({
      ...toPayloadBase(s),
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Horário zero — marco inicial dos prazos</SectionTitle>
      <div className="grid grid-cols-2 gap-3 items-start">
        <DateField label={`Data${REQ}`} value={s.horarioZeroData} readOnly={ro} onChange={(v) => set("horarioZeroData", v)} />
        <TimeInput label={`Hora${REQ}`} value={s.horarioZeroHora} readOnly={ro} onChange={(v) => set("horarioZeroHora", v)} />
      </div>

      <SectionTitle>Foco principal suspeito</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Pulmonar" checked={s.pulmonar} disabled={ro} onChange={(v) => set("pulmonar", v)} />
        <CheckRow label="Urinário" checked={s.urinario} disabled={ro} onChange={(v) => set("urinario", v)} />
        <CheckRow label="Abdominal" checked={s.abdominal} disabled={ro} onChange={(v) => set("abdominal", v)} />
        <CheckRow label="Pele / partes moles" checked={s.peleMoles} disabled={ro} onChange={(v) => set("peleMoles", v)} />
        <CheckRow label="SNC / Meningite" checked={s.snc} disabled={ro} onChange={(v) => set("snc", v)} />
        <CheckRow label="Cateter" checked={s.cateter} disabled={ro} onChange={(v) => set("cateter", v)} />
        {!ped && <CheckRow label="Endocardite" checked={s.endocardite} disabled={ro} onChange={(v) => set("endocardite", v)} />}
        <CheckRow label="Não definido" checked={s.naoDefinido} disabled={ro} onChange={(v) => set("naoDefinido", v)} />
        <CheckRow label="Outro" checked={s.outro} disabled={ro} onChange={(v) => set("outro", v)} />
      </div>
      {s.outro && (
        <Input label="Qual outro foco?" value={s.outroDesc} readOnly={ro} onChange={(e) => set("outroDesc", e.target.value)} />
      )}

      {ped ? (
        <>
          <SectionTitle>SIRS pediátrica (≥2 — obrigatório temperatura ou leucócitos)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <CheckRow label="Temperatura > 38,3°C ou < 36°C" checked={s.temperatura} disabled={ro} onChange={(v) => set("temperatura", v)} />
            <CheckRow label="Taquicardia para a idade" checked={s.taquicardia} disabled={ro} onChange={(v) => set("taquicardia", v)} />
            <CheckRow label="Taquipneia / dessaturação" checked={s.taquipneia} disabled={ro} onChange={(v) => set("taquipneia", v)} />
            <CheckRow label="Leucocitose / leucopenia" checked={s.leucocitose} disabled={ro} onChange={(v) => set("leucocitose", v)} />
          </div>
          <SectionTitle>Sinais de hipoperfusão / alerta</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <CheckRow label="TEC > 2s (choque frio)" checked={s.tecLento} disabled={ro} onChange={(v) => set("tecLento", v)} />
            <CheckRow label="Perfusão flash (choque quente)" checked={s.perfusaoFlash} disabled={ro} onChange={(v) => set("perfusaoFlash", v)} />
            <CheckRow label="Alteração mental" checked={s.alteracaoMental} disabled={ro} onChange={(v) => set("alteracaoMental", v)} />
            <CheckRow label="Oligúria < 1 mL/kg/h" checked={s.oliguria} disabled={ro} onChange={(v) => set("oliguria", v)} />
            <CheckRow label="Hipotensão (sinal tardio)" checked={s.hipotensao} disabled={ro} onChange={(v) => set("hipotensao", v)} />
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Critério de abertura</SectionTitle>
          <div className="flex flex-col">
            <CheckRow label="Infecção suspeita/confirmada + disfunção orgânica aguda" checked={s.criterioInfeccaoDisfuncao} disabled={ro} onChange={(v) => set("criterioInfeccaoDisfuncao", v)} />
            <CheckRow label="≥ 2 critérios de SIRS" checked={s.criterioSirs2} disabled={ro} onChange={(v) => set("criterioSirs2", v)} />
          </div>
          <SectionTitle>Disfunções orgânicas (ILAS 2022)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <CheckRow label="Hemodinâmico (PAS<90 / PAM<65)" checked={s.hemodinamico} disabled={ro} onChange={(v) => set("hemodinamico", v)} />
            <CheckRow label="Renal (oligúria / creatinina>2)" checked={s.renal} disabled={ro} onChange={(v) => set("renal", v)} />
            <CheckRow label="Respiratório (PaO₂/FiO₂<300)" checked={s.respiratorio} disabled={ro} onChange={(v) => set("respiratorio", v)} />
            <CheckRow label="Hematológico (plaq<100k)" checked={s.hematologico} disabled={ro} onChange={(v) => set("hematologico", v)} />
            <CheckRow label="Metabólico (lactato>2x)" checked={s.metabolico} disabled={ro} onChange={(v) => set("metabolico", v)} />
            <CheckRow label="Neurológico (rebaixamento)" checked={s.neurologico} disabled={ro} onChange={(v) => set("neurologico", v)} />
            <CheckRow label="Hepático (bilirrubinas>2x)" checked={s.hepatico} disabled={ro} onChange={(v) => set("hepatico", v)} />
            <CheckRow label="Coagulopatia (RNI>1,5 / TTPA>60s)" checked={s.coagulopatia} disabled={ro} onChange={(v) => set("coagulopatia", v)} />
          </div>
        </>
      )}

      <SectionTitle>Classificação na abertura{REQ}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {classificacaoOpts.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.classificacao === val} disabled={ro} onClick={() => set("classificacao", val)} />
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
