import { useState } from "react";
import type { BlocoDesfecho, DestinoPaciente } from "@/types";
import type { SubmitDesfechoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import { SectionTitle, CheckRow, RadioPill, DateField, EtapaFechadaInfo, FecharEtapaBar, NumericInput } from "./form-ui";

interface Props {
  initial: BlocoDesfecho | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitDesfechoPayload) => void;
  responsavel: { nome: string; registro: string };
}

const DESTINOS: { value: DestinoPaciente; label: string }[] = [
  { value: "alta_ambulatorial", label: "Alta com seguimento ambulatorial" },
  { value: "observacao", label: "Observação monitorada" },
  { value: "internacao_uti", label: "Internação na UTI da unidade" },
  { value: "transferencia_icp", label: "Transferência p/ serviço com hemodinâmica (ICP)" },
  { value: "transferencia_uti_referencia", label: "Transferência p/ UTI de referência" },
  { value: "obito", label: "Óbito" },
];

function fromInitial(i: BlocoDesfecho | null) {
  return {
    trombolitiseElegivel: i?.trombolitiseElegivel ?? false,
    trombolitiseMotivoNao: i?.trombolitiseMotivoNao ?? "",
    inicioFibrinolitico: i?.inicioFibrinolitico ?? "",
    tempoPortaAgulhaMin: i?.tempoPortaAgulhaMin ?? "",
    criteriosReperfusao: i?.criteriosReperfusao ?? { resolucaoSt50: false, eva3: false, arritmiaReperfusao: false },
    eficaciaTrombolise: i?.eficaciaTrombolise ?? "",
    medidasAdmissao: i?.medidasAdmissao ?? { aas: false, p2y12: false, anticoagulante: false, monitorizacao: false, o2: false },
    prescricoesAlta: i?.prescricoesAlta ?? { aas: false, p2y12: false, estatina: false, betabloqueador: false, iecaBra: false },
    destino: i?.destino ?? ("" as DestinoPaciente),
    obitoData: i?.obitoData ?? "",
    obitoHora: i?.obitoHora ?? "",
    solicitacaoRegulacaoHora: i?.solicitacaoRegulacaoHora ?? "",
    confirmacaoVagaHora: i?.confirmacaoVagaHora ?? "",
    saidaEfetivaHora: i?.saidaEfetivaHora ?? "",
    altaSeguraCriterios: i?.altaSeguraCriterios ?? {
      heart3TropNeg: false, ecgSemIsquemia: false, semInstabilidade: false,
      daaTepAfastados: false, seguimentoAgendado: false, orientacoesEntregues: false,
    },
    enfermeiroNomeCoren: i?.enfermeiroNomeCoren ?? "",
    medicoNomeCrm: i?.medicoNomeCrm ?? "",
  };
}

export default function BlocoDesfechoForm({ initial, readOnly, submitting, onSubmit, responsavel }: Props) {
  const [s, setS] = useState(() => fromInitial(initial));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  const toggle = <
    G extends "criteriosReperfusao" | "medidasAdmissao" | "prescricoesAlta" | "altaSeguraCriterios",
  >(group: G, key: keyof (typeof s)[G], v: boolean) =>
    setS((p) => ({ ...p, [group]: { ...p[group], [key]: v } }));

  const handleSubmit = () => {
    onSubmit({
      ...s,
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 5 — Trombólise (VIA I — IAMCSST)</SectionTitle>
      <CheckRow label="Elegível para trombólise?" checked={s.trombolitiseElegivel} disabled={ro} onChange={(v) => set("trombolitiseElegivel", v)} />
      {s.trombolitiseElegivel ? (
        <>
          <div className="grid grid-cols-2 gap-3 items-start">
            <TimeInput label="Início do fibrinolítico" value={s.inicioFibrinolitico} readOnly={ro} onChange={(v) => set("inicioFibrinolitico", v)} />
            <NumericInput label="Tempo porta-agulha (min)" mode="int" value={s.tempoPortaAgulhaMin} readOnly={ro} onChange={(v) => set("tempoPortaAgulhaMin", v)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Critérios de reperfusão (60–90 min)</span>
            <CheckRow label="Resolução supra ST ≥ 50%" checked={s.criteriosReperfusao.resolucaoSt50} disabled={ro} onChange={(v) => toggle("criteriosReperfusao", "resolucaoSt50", v)} />
            <CheckRow label="EVA ≤ 3" checked={s.criteriosReperfusao.eva3} disabled={ro} onChange={(v) => toggle("criteriosReperfusao", "eva3", v)} />
            <CheckRow label="Arritmia de reperfusão (RIVA)" checked={s.criteriosReperfusao.arritmiaReperfusao} disabled={ro} onChange={(v) => toggle("criteriosReperfusao", "arritmiaReperfusao", v)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Eficácia</span>
            <div className="grid grid-cols-2 gap-2">
              <RadioPill label="Sucesso (≥ 2 critérios)" selected={s.eficaciaTrombolise === "sucesso"} disabled={ro} onClick={() => set("eficaciaTrombolise", "sucesso")} />
              <RadioPill label="Falha → ICP resgate" selected={s.eficaciaTrombolise === "falha"} disabled={ro} onClick={() => set("eficaciaTrombolise", "falha")} />
            </div>
          </div>
        </>
      ) : (
        <Input label="Motivo da não trombólise" value={s.trombolitiseMotivoNao} readOnly={ro} onChange={(e) => set("trombolitiseMotivoNao", e.target.value)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Medidas na admissão (SCA confirmada)</span>
          <CheckRow label="AAS 300 mg VO" checked={s.medidasAdmissao.aas} disabled={ro} onChange={(v) => toggle("medidasAdmissao", "aas", v)} />
          <CheckRow label="Antiagregante P2Y12" checked={s.medidasAdmissao.p2y12} disabled={ro} onChange={(v) => toggle("medidasAdmissao", "p2y12", v)} />
          <CheckRow label="Anticoagulante" checked={s.medidasAdmissao.anticoagulante} disabled={ro} onChange={(v) => toggle("medidasAdmissao", "anticoagulante", v)} />
          <CheckRow label="Monitorização contínua / desfibrilador" checked={s.medidasAdmissao.monitorizacao} disabled={ro} onChange={(v) => toggle("medidasAdmissao", "monitorizacao", v)} />
          <CheckRow label="O₂ se SpO₂ < 90%" checked={s.medidasAdmissao.o2} disabled={ro} onChange={(v) => toggle("medidasAdmissao", "o2", v)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Prescrições na alta (SCA confirmada)</span>
          <CheckRow label="AAS (manutenção)" checked={s.prescricoesAlta.aas} disabled={ro} onChange={(v) => toggle("prescricoesAlta", "aas", v)} />
          <CheckRow label="P2Y12" checked={s.prescricoesAlta.p2y12} disabled={ro} onChange={(v) => toggle("prescricoesAlta", "p2y12", v)} />
          <CheckRow label="Estatina alta intensidade" checked={s.prescricoesAlta.estatina} disabled={ro} onChange={(v) => toggle("prescricoesAlta", "estatina", v)} />
          <CheckRow label="Betabloqueador" checked={s.prescricoesAlta.betabloqueador} disabled={ro} onChange={(v) => toggle("prescricoesAlta", "betabloqueador", v)} />
          <CheckRow label="IECA / BRA" checked={s.prescricoesAlta.iecaBra} disabled={ro} onChange={(v) => toggle("prescricoesAlta", "iecaBra", v)} />
        </div>
      </div>

      <SectionTitle>Etapa 6 — Encaminhamento final</SectionTitle>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Destino do paciente</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DESTINOS.map((d) => (
            <RadioPill key={d.value} label={d.label} selected={s.destino === d.value} disabled={ro} onClick={() => set("destino", d.value)} />
          ))}
        </div>
      </div>
      {s.destino === "obito" && (
        <div className="grid grid-cols-2 gap-3 items-start">
          <DateField label="Óbito — data" value={s.obitoData} readOnly={ro} onChange={(v) => set("obitoData", v)} />
          <TimeInput label="Óbito — hora" value={s.obitoHora} readOnly={ro} onChange={(v) => set("obitoHora", v)} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Marcos de transferência</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <TimeInput label="Solicitação à regulação" value={s.solicitacaoRegulacaoHora} readOnly={ro} onChange={(v) => set("solicitacaoRegulacaoHora", v)} />
          <TimeInput label="Confirmação de vaga" value={s.confirmacaoVagaHora} readOnly={ro} onChange={(v) => set("confirmacaoVagaHora", v)} />
          <TimeInput label="Saída efetiva da unidade" value={s.saidaEfetivaHora} readOnly={ro} onChange={(v) => set("saidaEfetivaHora", v)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Alta segura — critérios verificados</span>
        <CheckRow label="HEART ≤ 3 + Troponina negativa" checked={s.altaSeguraCriterios.heart3TropNeg} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "heart3TropNeg", v)} />
        <CheckRow label="ECG sem alterações isquêmicas" checked={s.altaSeguraCriterios.ecgSemIsquemia} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "ecgSemIsquemia", v)} />
        <CheckRow label="Sem instabilidade no período de observação" checked={s.altaSeguraCriterios.semInstabilidade} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "semInstabilidade", v)} />
        <CheckRow label="DAA e TEP afastados" checked={s.altaSeguraCriterios.daaTepAfastados} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "daaTepAfastados", v)} />
        <CheckRow label="Seguimento ambulatorial agendado" checked={s.altaSeguraCriterios.seguimentoAgendado} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "seguimentoAgendado", v)} />
        <CheckRow label="Orientações de retorno entregues" checked={s.altaSeguraCriterios.orientacoesEntregues} disabled={ro} onChange={(v) => toggle("altaSeguraCriterios", "orientacoesEntregues", v)} />
      </div>

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label="Concluir protocolo →" />
      )}
    </div>
  );
}
