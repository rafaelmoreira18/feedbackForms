import { useState, useEffect } from "react";
import type { BlocoInvestigacao } from "@/types";
import type { SubmitInvestigacaoPayload } from "@/services/protocolo-service";
import TimeInput from "@/components/ui/time-input";
import Text from "@/components/ui/text";
import { SectionTitle, CheckRow, RadioPill, EtapaFechadaInfo, FecharEtapaBar, NumericInput, PendenciasBox, REQ } from "./form-ui";

interface Props {
  initial: BlocoInvestigacao | null;
  rascunho?: Partial<BlocoInvestigacao> | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitInvestigacaoPayload) => void;
  onDraftChange?: (dados: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  submitLabel?: string;
}

const emptyColeta = { horaColeta: "", resultado: "", horaResultadoLab: "" };

const HEART_ITEMS: {
  key: "heartH" | "heartE" | "heartA" | "heartR" | "heartT";
  label: string;
  opts: [string, string, string];
}[] = [
  { key: "heartH", label: "H — História clínica", opts: ["Pouco/nada suspeito (0)", "Moderado (1)", "Altamente suspeito (2)"] },
  { key: "heartE", label: "E — ECG", opts: ["Normal (0)", "Repol. inespecífica (1)", "Depressão ST / BRE (2)"] },
  { key: "heartA", label: "A — Idade", opts: ["< 45 anos (0)", "45–64 anos (1)", "≥ 65 anos (2)"] },
  { key: "heartR", label: "R — Fatores de risco", opts: ["Nenhum (0)", "1–2 fatores (1)", "≥ 3 fatores ou DAC (2)"] },
  { key: "heartT", label: "T — Troponina", opts: ["≤ LSN (0)", "1–3× LSN (1)", "≥ 3× LSN (2)"] },
];

function faixaFromTotal(total: number): BlocoInvestigacao["heartFaixaRisco"] {
  if (total <= 3) return "baixo";
  if (total <= 6) return "intermediario";
  return "alto";
}

const FAIXA_LABEL: Record<string, string> = {
  baixo: "0–3 BAIXO RISCO",
  intermediario: "4–6 INTERMEDIÁRIO",
  alto: "7–10 ALTO RISCO",
};

const emptyDx = {
  naoSeAplica: false,
  dissecaoAorta: false, dissecaoAortaAddRs: "", tep: false, tepWells: "",
  pericardite: false, takotsubo: false, pneumotorax: false, tamponamento: false,
};

function fromInitial(i: BlocoInvestigacao | null, r?: Partial<BlocoInvestigacao> | null) {
  const src = i ?? (r as BlocoInvestigacao | null);
  return {
    lsnUnidade: src?.lsnUnidade ?? "",
    coleta0h: src?.coleta0h ?? { ...emptyColeta },
    coleta3h: src?.coleta3h ?? { ...emptyColeta },
    coleta3hDeltaPct: src?.coleta3hDeltaPct ?? "",
    coleta6h: src?.coleta6h ?? { ...emptyColeta },
    troponinaInterpretacao: src?.troponinaInterpretacao ?? "",
    heartH: src?.heartH ?? 0, heartE: src?.heartE ?? 0, heartA: src?.heartA ?? 0,
    heartR: src?.heartR ?? 0, heartT: src?.heartT ?? 0,
    condutaHeart: src?.condutaHeart ?? "",
    diagnosticos: { ...emptyDx, ...(src?.diagnosticos ?? {}) },
  };
}

function toPayloadBase(s: ReturnType<typeof fromInitial>, heartTotal: number, faixa: BlocoInvestigacao["heartFaixaRisco"]) {
  return {
    lsnUnidade: s.lsnUnidade,
    coleta0h: s.coleta0h,
    coleta3h: s.coleta3h,
    coleta3hDeltaPct: s.coleta3hDeltaPct,
    coleta6h: s.coleta6h,
    troponinaInterpretacao: s.troponinaInterpretacao,
    heartH: s.heartH, heartE: s.heartE, heartA: s.heartA, heartR: s.heartR, heartT: s.heartT,
    heartTotal,
    heartFaixaRisco: faixa,
    condutaHeart: s.condutaHeart,
    diagnosticos: s.diagnosticos,
  };
}

export default function BlocoInvestigacaoForm({ initial, rascunho, readOnly, submitting, onSubmit, onDraftChange, responsavel, submitLabel }: Props) {
  const [s, setS] = useState(() => fromInitial(initial, rascunho));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  const heartTotal = s.heartH + s.heartE + s.heartA + s.heartR + s.heartT;
  const faixa = faixaFromTotal(heartTotal);

  useEffect(() => {
    if (ro || !onDraftChange) return;
    onDraftChange(toPayloadBase(s, heartTotal, faixa));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const setColeta = (
    key: "coleta0h" | "coleta3h" | "coleta6h",
    field: "horaColeta" | "resultado" | "horaResultadoLab",
    value: string,
  ) => setS((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));

  const setDx = <K extends keyof typeof s.diagnosticos>(k: K, v: (typeof s.diagnosticos)[K]) =>
    setS((p) => ({ ...p, diagnosticos: { ...p.diagnosticos, [k]: v } }));

  // N/A exclui os demais diagnósticos; marcar qualquer Dx limpa o N/A.
  const setNaoSeAplica = (v: boolean) =>
    setS((p) => ({
      ...p,
      diagnosticos: v ? { ...emptyDx, naoSeAplica: true } : { ...p.diagnosticos, naoSeAplica: false },
    }));
  const dxDisabled = ro || s.diagnosticos.naoSeAplica;

  const [mostrarPend, setMostrarPend] = useState(false);

  // Obrigatórios com exceções: coleta 3h/6h são condicionais; Dx resolve-se via N/A ou ≥1 marcado.
  const algumDx = s.diagnosticos.naoSeAplica || s.diagnosticos.dissecaoAorta || s.diagnosticos.tep ||
    s.diagnosticos.pericardite || s.diagnosticos.takotsubo || s.diagnosticos.pneumotorax || s.diagnosticos.tamponamento;
  const pendencias: string[] = [];
  if (!s.lsnUnidade) pendencias.push("LSN da unidade");
  if (!s.coleta0h.horaColeta) pendencias.push("Coleta 0h — hora");
  if (!s.coleta0h.resultado) pendencias.push("Coleta 0h — resultado");
  if (!s.troponinaInterpretacao) pendencias.push("Interpretação da troponina");
  if (!s.condutaHeart) pendencias.push("Conduta orientada pelo HEART");
  if (!algumDx) pendencias.push("Diagnósticos diferenciais (marque ao menos 1 ou N/A)");

  const handleSubmit = () => {
    if (pendencias.length > 0) {
      setMostrarPend(true);
      return;
    }
    onSubmit({
      ...toPayloadBase(s, heartTotal, faixa),
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 3 — Marcadores (Troponina 0-3-6h)</SectionTitle>
      <NumericInput label={`LSN da unidade (ng/mL)${REQ}`} placeholder="0,04" mode="decimal" decimals={2} min={0} max={10} value={s.lsnUnidade} readOnly={ro} onChange={(v) => set("lsnUnidade", v)} hint="ng/mL · ex.: 0,04" />
      {(["coleta0h", "coleta3h", "coleta6h"] as const).map((key, idx) => (
        <div key={key} className="rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
          <Text variant="body-sm-bold" className="text-gray-400">
            {idx === 0 ? "Coleta 0h" : idx === 1 ? "Coleta 3h" : "Coleta 6h (se indicada)"}
          </Text>
          <div className="grid grid-cols-3 gap-2 items-start">
            <TimeInput label={`Hora coleta${idx === 0 ? REQ : ""}`} value={s[key].horaColeta} readOnly={ro} onChange={(v) => setColeta(key, "horaColeta", v)} />
            <NumericInput label={`Resultado (ng/mL)${idx === 0 ? REQ : ""}`} placeholder="0,00" mode="decimal" decimals={2} min={0} max={1000} value={s[key].resultado} readOnly={ro} onChange={(v) => setColeta(key, "resultado", v)} hint="ng/mL" />
            <TimeInput label="Hora result. lab" value={s[key].horaResultadoLab} readOnly={ro} onChange={(v) => setColeta(key, "horaResultadoLab", v)} />
          </div>
          {idx === 1 && (
            <NumericInput label="Delta (3h−0h)/0h × 100 (%)" mode="decimal" min={-100} max={5000} value={s.coleta3hDeltaPct} readOnly={ro} onChange={(v) => set("coleta3hDeltaPct", v)} hint="variação %" />
          )}
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Interpretação{REQ}</span>
        <div className="grid grid-cols-3 gap-2">
          <RadioPill label="Rule-in" selected={s.troponinaInterpretacao === "rule_in"} disabled={ro} onClick={() => set("troponinaInterpretacao", "rule_in")} />
          <RadioPill label="Rule-out" selected={s.troponinaInterpretacao === "rule_out"} disabled={ro} onClick={() => set("troponinaInterpretacao", "rule_out")} />
          <RadioPill label="Inconclusivo" selected={s.troponinaInterpretacao === "inconclusivo"} disabled={ro} onClick={() => set("troponinaInterpretacao", "inconclusivo")} />
        </div>
      </div>

      <SectionTitle>Escore HEART</SectionTitle>
      {HEART_ITEMS.map((item) => (
        <div key={item.key} className="flex flex-col gap-1.5">
          <span className="text-sm font-sans font-semibold text-gray-400">{item.label}</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {item.opts.map((opt, val) => (
              <RadioPill key={val} label={opt} selected={s[item.key] === val} disabled={ro} onClick={() => setS((p) => ({ ...p, [item.key]: val }))} />
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-gray-50 p-4 flex items-center justify-between">
        <Text variant="body-md-bold" className="text-gray-400">Pontuação total: {heartTotal} / 10</Text>
        <span className={`text-sm font-semibold font-sans px-3 py-1 rounded-full ${
          faixa === "baixo" ? "bg-green-base/10 text-green-base" : faixa === "intermediario" ? "bg-blue-base/10 text-blue-base" : "bg-red-base/10 text-red-base"
        }`}>{FAIXA_LABEL[faixa]}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Conduta orientada pelo HEART{REQ}</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <RadioPill label="Alta segura" selected={s.condutaHeart === "alta_segura"} disabled={ro} onClick={() => set("condutaHeart", "alta_segura")} />
          <RadioPill label="Observação / investigação" selected={s.condutaHeart === "observacao"} disabled={ro} onClick={() => set("condutaHeart", "observacao")} />
          <RadioPill label="Internação" selected={s.condutaHeart === "internacao"} disabled={ro} onClick={() => set("condutaHeart", "internacao")} />
        </div>
      </div>

      <SectionTitle>Diagnósticos diferenciais{REQ}</SectionTitle>
      <CheckRow
        label="N/A — não se aplica a este paciente"
        checked={s.diagnosticos.naoSeAplica}
        disabled={ro}
        onChange={setNaoSeAplica}
      />
      <div className={`flex flex-col gap-1 ${s.diagnosticos.naoSeAplica ? "opacity-40" : ""}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <CheckRow label="Dissecção Aguda de Aorta" checked={s.diagnosticos.dissecaoAorta} disabled={dxDisabled} onChange={(v) => setDx("dissecaoAorta", v)} />
          {s.diagnosticos.dissecaoAorta && (
            <NumericInput label="ADD-RS" className="max-w-32" mode="int" min={0} max={3} value={s.diagnosticos.dissecaoAortaAddRs} readOnly={dxDisabled} onChange={(v) => setDx("dissecaoAortaAddRs", v)} hint="0–3" />
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CheckRow label="TEP" checked={s.diagnosticos.tep} disabled={dxDisabled} onChange={(v) => setDx("tep", v)} />
          {s.diagnosticos.tep && (
            <NumericInput label="Wells" className="max-w-32" mode="decimal" decimals={1} min={0} max={12.5} value={s.diagnosticos.tepWells} readOnly={dxDisabled} onChange={(v) => setDx("tepWells", v)} hint="0–12,5" />
          )}
        </div>
        <CheckRow label="Pericardite" checked={s.diagnosticos.pericardite} disabled={dxDisabled} onChange={(v) => setDx("pericardite", v)} />
        <CheckRow label="Takotsubo" checked={s.diagnosticos.takotsubo} disabled={dxDisabled} onChange={(v) => setDx("takotsubo", v)} />
        <CheckRow label="Pneumotórax" checked={s.diagnosticos.pneumotorax} disabled={dxDisabled} onChange={(v) => setDx("pneumotorax", v)} />
        <CheckRow label="Tamponamento" checked={s.diagnosticos.tamponamento} disabled={dxDisabled} onChange={(v) => setDx("tamponamento", v)} />
      </div>

      {!ro && mostrarPend && <PendenciasBox pendencias={pendencias} />}

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} label={submitLabel} />
      )}
    </div>
  );
}
