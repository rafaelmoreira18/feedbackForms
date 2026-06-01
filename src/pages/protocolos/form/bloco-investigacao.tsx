import { useState } from "react";
import type { BlocoInvestigacao } from "@/types";
import type { SubmitInvestigacaoPayload } from "@/services/protocolo-service";
import TimeInput from "@/components/ui/time-input";
import Text from "@/components/ui/text";
import { SectionTitle, CheckRow, RadioPill, EtapaFechadaInfo, FecharEtapaBar, NumericInput } from "./form-ui";

interface Props {
  initial: BlocoInvestigacao | null;
  readOnly: boolean;
  submitting: boolean;
  onSubmit: (payload: SubmitInvestigacaoPayload) => void;
  responsavel: { nome: string; registro: string };
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

function fromInitial(i: BlocoInvestigacao | null) {
  return {
    lsnUnidade: i?.lsnUnidade ?? "",
    coleta0h: i?.coleta0h ?? { ...emptyColeta },
    coleta3h: i?.coleta3h ?? { ...emptyColeta },
    coleta3hDeltaPct: i?.coleta3hDeltaPct ?? "",
    coleta6h: i?.coleta6h ?? { ...emptyColeta },
    troponinaInterpretacao: i?.troponinaInterpretacao ?? "",
    heartH: i?.heartH ?? 0, heartE: i?.heartE ?? 0, heartA: i?.heartA ?? 0,
    heartR: i?.heartR ?? 0, heartT: i?.heartT ?? 0,
    condutaHeart: i?.condutaHeart ?? "",
    diagnosticos: i?.diagnosticos ?? {
      dissecaoAorta: false, dissecaoAortaAddRs: "", tep: false, tepWells: "",
      pericardite: false, takotsubo: false, pneumotorax: false, tamponamento: false,
    },
  };
}

export default function BlocoInvestigacaoForm({ initial, readOnly, submitting, onSubmit, responsavel }: Props) {
  const [s, setS] = useState(() => fromInitial(initial));
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const ro = readOnly;

  const heartTotal = s.heartH + s.heartE + s.heartA + s.heartR + s.heartT;
  const faixa = faixaFromTotal(heartTotal);

  const setColeta = (
    key: "coleta0h" | "coleta3h" | "coleta6h",
    field: "horaColeta" | "resultado" | "horaResultadoLab",
    value: string,
  ) => setS((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));

  const setDx = <K extends keyof typeof s.diagnosticos>(k: K, v: (typeof s.diagnosticos)[K]) =>
    setS((p) => ({ ...p, diagnosticos: { ...p.diagnosticos, [k]: v } }));

  const handleSubmit = () => {
    onSubmit({
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
      responsavelNome: responsavel.nome,
      registroProfissional: responsavel.registro,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Etapa 3 — Marcadores (Troponina 0-3-6h)</SectionTitle>
      <NumericInput label="LSN da unidade (ng/mL)" mode="decimal" value={s.lsnUnidade} readOnly={ro} onChange={(v) => set("lsnUnidade", v)} />
      {(["coleta0h", "coleta3h", "coleta6h"] as const).map((key, idx) => (
        <div key={key} className="rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
          <Text variant="body-sm-bold" className="text-gray-400">
            {idx === 0 ? "Coleta 0h" : idx === 1 ? "Coleta 3h" : "Coleta 6h (se indicada)"}
          </Text>
          <div className="grid grid-cols-3 gap-2 items-start">
            <TimeInput label="Hora coleta" value={s[key].horaColeta} readOnly={ro} onChange={(v) => setColeta(key, "horaColeta", v)} />
            <NumericInput label="Resultado (ng/mL)" mode="decimal" value={s[key].resultado} readOnly={ro} onChange={(v) => setColeta(key, "resultado", v)} />
            <TimeInput label="Hora result. lab" value={s[key].horaResultadoLab} readOnly={ro} onChange={(v) => setColeta(key, "horaResultadoLab", v)} />
          </div>
          {idx === 1 && (
            <NumericInput label="Delta (3h−0h)/0h × 100 (%)" mode="decimal" value={s.coleta3hDeltaPct} readOnly={ro} onChange={(v) => set("coleta3hDeltaPct", v)} />
          )}
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Interpretação</span>
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
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Conduta orientada pelo HEART</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <RadioPill label="Alta segura" selected={s.condutaHeart === "alta_segura"} disabled={ro} onClick={() => set("condutaHeart", "alta_segura")} />
          <RadioPill label="Observação / investigação" selected={s.condutaHeart === "observacao"} disabled={ro} onClick={() => set("condutaHeart", "observacao")} />
          <RadioPill label="Internação" selected={s.condutaHeart === "internacao"} disabled={ro} onClick={() => set("condutaHeart", "internacao")} />
        </div>
      </div>

      <SectionTitle>Diagnósticos diferenciais</SectionTitle>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <CheckRow label="Dissecção Aguda de Aorta" checked={s.diagnosticos.dissecaoAorta} disabled={ro} onChange={(v) => setDx("dissecaoAorta", v)} />
          {s.diagnosticos.dissecaoAorta && (
            <NumericInput label="ADD-RS" className="max-w-32" mode="int" value={s.diagnosticos.dissecaoAortaAddRs} readOnly={ro} onChange={(v) => setDx("dissecaoAortaAddRs", v)} />
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CheckRow label="TEP" checked={s.diagnosticos.tep} disabled={ro} onChange={(v) => setDx("tep", v)} />
          {s.diagnosticos.tep && (
            <NumericInput label="Wells" className="max-w-32" mode="decimal" value={s.diagnosticos.tepWells} readOnly={ro} onChange={(v) => setDx("tepWells", v)} />
          )}
        </div>
        <CheckRow label="Pericardite" checked={s.diagnosticos.pericardite} disabled={ro} onChange={(v) => setDx("pericardite", v)} />
        <CheckRow label="Takotsubo" checked={s.diagnosticos.takotsubo} disabled={ro} onChange={(v) => setDx("takotsubo", v)} />
        <CheckRow label="Pneumotórax" checked={s.diagnosticos.pneumotorax} disabled={ro} onChange={(v) => setDx("pneumotorax", v)} />
        <CheckRow label="Tamponamento" checked={s.diagnosticos.tamponamento} disabled={ro} onChange={(v) => setDx("tamponamento", v)} />
      </div>

      {ro ? (
        <EtapaFechadaInfo nome={initial?.responsavelNome ?? ""} registro={initial?.registroProfissional ?? ""} fechadoEm={initial?.fechadoEm} />
      ) : (
        <FecharEtapaBar submitting={submitting} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
