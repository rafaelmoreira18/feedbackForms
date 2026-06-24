import { useState, useEffect } from "react";
import type { AvcBlocoImagem, AvcResultadoTc } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, NumericInput, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoImagem | null;
  rascunho?: Partial<AvcBlocoImagem> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoImagem, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  fluxo: "",
  tcSolicitacaoHora: "", tcInicioHora: "", tcLaudoHora: "", aspects: "", resultadoTc: "",
  angioTcRealizada: false, lvoSuspeita: false, condutaAposImagem: "",
  teleconsultaRealizada: false, teleconsultaHora: "", neurologistaConsultado: "", recomendacaoTeleconsulta: "",
  regulacaoAcionada: false, regulacaoHora: "", unidadeDestino: "", aceiteVagaHora: "", saidaUnidadeHora: "",
  didoMin: "", condicoesTransferencia: "",
};

function fromInitial(i: AvcBlocoImagem | null, r?: Partial<AvcBlocoImagem> | null): State {
  const src = i ?? (r as AvcBlocoImagem | null);
  if (!src) return structuredClone(empty);
  return { ...empty, ...src } as State;
}

const RESULTADO_TC: { value: AvcResultadoTc; label: string }[] = [
  { value: "", label: "Selecione..." },
  { value: "sem_hemorragia", label: "Sem hemorragia" },
  { value: "hemorragia_intraparenquimatosa", label: "Hemorragia intraparenquimatosa" },
  { value: "hemorragia_subaracnoidea", label: "Hemorragia subaracnóidea" },
  { value: "sinais_precoces_isquemia", label: "Sinais precoces de isquemia" },
  { value: "tc_normal", label: "TC normal" },
];

export default function BlocoImagemForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pendencias: string[] = [];
  if (!s.fluxo) pendencias.push("Fluxo assistencial (A ou B)");
  if (s.fluxo === "a" && !s.resultadoTc) pendencias.push("Resultado da TC");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...s, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Fluxo assistencial{REQ}</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <RadioPill label="Fluxo A — unidade COM tomografia" selected={s.fluxo === "a"} disabled={ro} onClick={() => set("fluxo", "a")} />
        <RadioPill label="Fluxo B — unidade SEM tomografia" selected={s.fluxo === "b"} disabled={ro} onClick={() => set("fluxo", "b")} />
      </div>

      {s.fluxo === "a" && (
        <>
          <SectionTitle>Fluxo A — Tomografia</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
            <TimeInput label="Solicitação da TC" value={s.tcSolicitacaoHora} readOnly={ro} onChange={(v) => set("tcSolicitacaoHora", v)} />
            <TimeInput label="Início da TC" value={s.tcInicioHora} readOnly={ro} onChange={(v) => set("tcInicioHora", v)} />
            <TimeInput label="Disponibilidade / laudo" value={s.tcLaudoHora} readOnly={ro} onChange={(v) => set("tcLaudoHora", v)} />
            <NumericInput label="ASPECTS" value={s.aspects} readOnly={ro} mode="int" min={0} max={10} onChange={(v) => set("aspects", v)} />
          </div>
          <Select label={`Resultado da TC${REQ}`} options={RESULTADO_TC} value={s.resultadoTc} disabled={ro} onChange={(e) => set("resultadoTc", e.target.value as AvcResultadoTc)} />
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <CheckRow label="Angio-TC realizada" checked={s.angioTcRealizada} disabled={ro} onChange={(v) => set("angioTcRealizada", v)} />
            <CheckRow label="Suspeita/confirmação de LVO (grande vaso)" checked={s.lvoSuspeita} disabled={ro} onChange={(v) => set("lvoSuspeita", v)} />
          </div>
          <Textarea label="Conduta após imagem" value={s.condutaAposImagem} readOnly={ro} rows={2} onChange={(e) => set("condutaAposImagem", e.target.value)} />
        </>
      )}

      {s.fluxo === "b" && (
        <>
          <SectionTitle>Fluxo B — Telestroke + regulação</SectionTitle>
          <CheckRow label="Teleconsulta realizada" checked={s.teleconsultaRealizada} disabled={ro} onChange={(v) => set("teleconsultaRealizada", v)} />
          <div className="grid grid-cols-2 gap-3 items-start">
            <TimeInput label="Hora da teleconsulta" value={s.teleconsultaHora} readOnly={ro} onChange={(v) => set("teleconsultaHora", v)} />
            <Input label="Neurologista/médico consultado" value={s.neurologistaConsultado} readOnly={ro} onChange={(e) => set("neurologistaConsultado", e.target.value)} />
          </div>
          <Textarea label="Recomendação da teleconsulta" value={s.recomendacaoTeleconsulta} readOnly={ro} rows={2} onChange={(e) => set("recomendacaoTeleconsulta", e.target.value)} />
          <CheckRow label="Regulação acionada" checked={s.regulacaoAcionada} disabled={ro} onChange={(v) => set("regulacaoAcionada", v)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
            <TimeInput label="Hora do acionamento" value={s.regulacaoHora} readOnly={ro} onChange={(v) => set("regulacaoHora", v)} />
            <Input label="Unidade de destino" value={s.unidadeDestino} readOnly={ro} onChange={(e) => set("unidadeDestino", e.target.value)} />
            <TimeInput label="Aceite da vaga" value={s.aceiteVagaHora} readOnly={ro} onChange={(v) => set("aceiteVagaHora", v)} />
            <TimeInput label="Saída da unidade" value={s.saidaUnidadeHora} readOnly={ro} onChange={(v) => set("saidaUnidadeHora", v)} />
            <NumericInput label="DIDO (min)" value={s.didoMin} readOnly={ro} mode="int" max={999} onChange={(v) => set("didoMin", v)} hint="door-in / door-out" />
          </div>
          <Textarea label="Condições clínicas na transferência" value={s.condicoesTransferencia} readOnly={ro} rows={2} onChange={(e) => set("condicoesTransferencia", e.target.value)} />
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
