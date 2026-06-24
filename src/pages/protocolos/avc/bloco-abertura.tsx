import { useState, useEffect } from "react";
import type { AvcBlocoAbertura } from "@/types";
import type { SubmitBlocoPayload } from "@/services/protocolo-service";
import Input from "@/components/ui/input";
import TimeInput from "@/components/ui/time-input";
import {
  SectionTitle, CheckRow, RadioPill, EtapaFechadaInfo, FecharEtapaBar, RascunhoNota,
  PendenciasBox, REQ,
} from "../form/form-ui";

interface Props {
  initial: AvcBlocoAbertura | null;
  rascunho?: Partial<AvcBlocoAbertura> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitBlocoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
  draftOnly?: boolean;
}

type State = Omit<AvcBlocoAbertura, "responsavelNome" | "registroProfissional" | "fechadoEm">;

const empty: State = {
  motivoAbertura: {
    deficitFocalAgudo: false, fastPositivo: false, cincinnatiPositiva: false, cefaleiaSubita: false,
    alteracaoConsciencia: false, suspeitaClinica: false, wakeUpStroke: false, outro: false, outroDesc: "",
  },
  fmcHora: "", inicioSintomasHora: "", lkwHora: "", tempoDesdeLkw: "", lkwResponsavelInfo: "", incertezaHorario: false,
  inicioTriagemHora: "", ativacaoCodigoAvcHora: "", classificacaoManchester: "", manchesterOutroDesc: "",
  profissionaisAcionados: {
    medico: false, enfermagem: false, laboratorio: false, imagem: false, neuroTelemedicina: false, regulacao: false,
  },
  preNotificacao: "", preNotificacaoHora: "",
};

function fromInitial(i: AvcBlocoAbertura | null, r?: Partial<AvcBlocoAbertura> | null): State {
  const src = i ?? (r as AvcBlocoAbertura | null);
  if (!src) return structuredClone(empty);
  return {
    motivoAbertura: { ...empty.motivoAbertura, ...(src.motivoAbertura ?? {}) },
    fmcHora: src.fmcHora ?? "", inicioSintomasHora: src.inicioSintomasHora ?? "", lkwHora: src.lkwHora ?? "",
    tempoDesdeLkw: src.tempoDesdeLkw ?? "", lkwResponsavelInfo: src.lkwResponsavelInfo ?? "",
    incertezaHorario: !!src.incertezaHorario,
    inicioTriagemHora: src.inicioTriagemHora ?? "", ativacaoCodigoAvcHora: src.ativacaoCodigoAvcHora ?? "",
    classificacaoManchester: src.classificacaoManchester ?? "", manchesterOutroDesc: src.manchesterOutroDesc ?? "",
    profissionaisAcionados: { ...empty.profissionaisAcionados, ...(src.profissionaisAcionados ?? {}) },
    preNotificacao: src.preNotificacao ?? "", preNotificacaoHora: src.preNotificacaoHora ?? "",
  };
}

const MANCHESTER: [State["classificacaoManchester"], string][] = [
  ["vermelho", "Vermelho"], ["laranja", "Laranja"], ["outro", "Outro"],
];
const PRE_NOTIF: [State["preNotificacao"], string][] = [["sim", "Sim"], ["nao", "Não"], ["na", "N/A"]];

export default function BlocoAberturaForm({
  initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel, draftOnly,
}: Props) {
  const [s, setS] = useState<State>(() => fromInitial(initial, rascunho));
  const ro = readOnly;
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setMotivo = (k: keyof State["motivoAbertura"], v: boolean | string) =>
    setS((p) => ({ ...p, motivoAbertura: { ...p.motivoAbertura, [k]: v } }));
  const setProf = (k: keyof State["profissionaisAcionados"], v: boolean) =>
    setS((p) => ({ ...p, profissionaisAcionados: { ...p.profissionaisAcionados, [k]: v } }));

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const m = s.motivoAbertura;
  const algumMotivo = m.deficitFocalAgudo || m.fastPositivo || m.cincinnatiPositiva || m.cefaleiaSubita ||
    m.alteracaoConsciencia || m.suspeitaClinica || m.wakeUpStroke || m.outro;

  const pendencias: string[] = [];
  if (!algumMotivo) pendencias.push("Motivo da abertura (marque ao menos um)");
  if (!s.fmcHora) pendencias.push("Hora do 1º contato (FMC)");
  if (!s.classificacaoManchester) pendencias.push("Classificação Manchester");
  const [mostrarPend, setMostrarPend] = useState(false);

  const handleSubmit = () => {
    if (pendencias.length > 0) { setMostrarPend(true); return; }
    onSubmit({ ...s, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Motivo da abertura{REQ} (um ou mais)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Déficit neurológico focal agudo" checked={m.deficitFocalAgudo} disabled={ro} onChange={(v) => setMotivo("deficitFocalAgudo", v)} />
        <CheckRow label="FAST positivo" checked={m.fastPositivo} disabled={ro} onChange={(v) => setMotivo("fastPositivo", v)} />
        <CheckRow label="Cincinnati positiva" checked={m.cincinnatiPositiva} disabled={ro} onChange={(v) => setMotivo("cincinnatiPositiva", v)} />
        <CheckRow label="Cefaleia súbita intensa (thunderclap)" checked={m.cefaleiaSubita} disabled={ro} onChange={(v) => setMotivo("cefaleiaSubita", v)} />
        <CheckRow label="Alteração aguda do nível de consciência" checked={m.alteracaoConsciencia} disabled={ro} onChange={(v) => setMotivo("alteracaoConsciencia", v)} />
        <CheckRow label="Suspeita clínica (decisão médica)" checked={m.suspeitaClinica} disabled={ro} onChange={(v) => setMotivo("suspeitaClinica", v)} />
        <CheckRow label="Sintomas ao acordar / wake-up stroke" checked={m.wakeUpStroke} disabled={ro} onChange={(v) => setMotivo("wakeUpStroke", v)} />
        <CheckRow label="Outro motivo" checked={m.outro} disabled={ro} onChange={(v) => setMotivo("outro", v)} />
      </div>
      {m.outro && (
        <Input label="Qual outro motivo?" value={m.outroDesc} readOnly={ro} onChange={(e) => setMotivo("outroDesc", e.target.value)} />
      )}

      <SectionTitle>Marcos temporais (FMC = marco zero)</SectionTitle>
      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label={`Hora do 1º contato (FMC)${REQ}`} value={s.fmcHora} readOnly={ro} onChange={(v) => set("fmcHora", v)} />
        <TimeInput label="Início dos sintomas" value={s.inicioSintomasHora} readOnly={ro} onChange={(v) => set("inicioSintomasHora", v)} />
        <TimeInput label="LKW — último momento visto bem" value={s.lkwHora} readOnly={ro} onChange={(v) => set("lkwHora", v)} />
        <Input label="Tempo estimado desde o LKW" value={s.tempoDesdeLkw} readOnly={ro} placeholder="ex.: 2h 30min" onChange={(e) => set("tempoDesdeLkw", e.target.value)} />
        <Input label="Responsável pela informação do LKW" value={s.lkwResponsavelInfo} readOnly={ro} onChange={(e) => set("lkwResponsavelInfo", e.target.value)} />
      </div>
      <CheckRow label="Incerteza quanto ao horário" checked={s.incertezaHorario} disabled={ro} onChange={(v) => set("incertezaHorario", v)} />

      <SectionTitle>Triagem e classificação de risco</SectionTitle>
      <div className="grid grid-cols-2 gap-3 items-start">
        <TimeInput label="Início da triagem" value={s.inicioTriagemHora} readOnly={ro} onChange={(v) => set("inicioTriagemHora", v)} />
        <TimeInput label="Ativação do Código AVC" value={s.ativacaoCodigoAvcHora} readOnly={ro} onChange={(v) => set("ativacaoCodigoAvcHora", v)} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Classificação Manchester{REQ}</span>
      <div className="flex flex-wrap gap-2">
        {MANCHESTER.map(([val, lbl]) => (
          <RadioPill key={val} label={lbl} selected={s.classificacaoManchester === val} disabled={ro} onClick={() => set("classificacaoManchester", val)} />
        ))}
      </div>
      {s.classificacaoManchester === "outro" && (
        <Input label="Qual classificação?" value={s.manchesterOutroDesc} readOnly={ro} onChange={(e) => set("manchesterOutroDesc", e.target.value)} />
      )}

      <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Profissionais acionados</span>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <CheckRow label="Médico" checked={s.profissionaisAcionados.medico} disabled={ro} onChange={(v) => setProf("medico", v)} />
        <CheckRow label="Enfermagem" checked={s.profissionaisAcionados.enfermagem} disabled={ro} onChange={(v) => setProf("enfermagem", v)} />
        <CheckRow label="Laboratório" checked={s.profissionaisAcionados.laboratorio} disabled={ro} onChange={(v) => setProf("laboratorio", v)} />
        <CheckRow label="Imagem" checked={s.profissionaisAcionados.imagem} disabled={ro} onChange={(v) => setProf("imagem", v)} />
        <CheckRow label="Neurologia / Telemedicina" checked={s.profissionaisAcionados.neuroTelemedicina} disabled={ro} onChange={(v) => setProf("neuroTelemedicina", v)} />
        <CheckRow label="Regulação" checked={s.profissionaisAcionados.regulacao} disabled={ro} onChange={(v) => setProf("regulacao", v)} />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Pré-notificação da unidade de referência</span>
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="flex flex-wrap gap-2">
          {PRE_NOTIF.map(([val, lbl]) => (
            <RadioPill key={val} label={lbl} selected={s.preNotificacao === val} disabled={ro} onClick={() => set("preNotificacao", val)} />
          ))}
        </div>
        <TimeInput label="Hora da pré-notificação" value={s.preNotificacaoHora} readOnly={ro} onChange={(v) => set("preNotificacaoHora", v)} />
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
