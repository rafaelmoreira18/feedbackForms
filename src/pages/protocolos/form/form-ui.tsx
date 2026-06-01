import React from "react";
import Text from "@/components/ui/text";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import DateInput from "@/components/ui/date-input";

// ── Helpers de data (data de nascimento é digitada DD/MM/AAAA) ───────────────
export function maskBrDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter((p) => p !== "");
  let out = parts[0] ?? "";
  if (parts[1] !== undefined) out += "/" + parts[1];
  if (parts[2] !== undefined) out += "/" + parts[2];
  return out;
}

export function brToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  const dd = +m[1], mm = +m[2], yy = +m[3];
  const dt = new Date(yy, mm - 1, dd);
  if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  return `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Idade (anos completos) a partir de uma data ISO; "" se inválida. */
export function ageFromIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  const birth = new Date(+m[1], +m[2] - 1, +m[3]);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 160 ? String(age) : "";
}

/** Título de seção dentro de um bloco. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="body-sm-bold" className="text-teal-dark uppercase tracking-wider mt-2">
      {children}
    </Text>
  );
}

/** Caixa de seleção (checkbox) com rótulo, no estilo do app. */
export function CheckRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 py-1.5 ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-teal-base rounded shrink-0"
      />
      <span className="text-sm font-sans text-gray-400">{label}</span>
    </label>
  );
}

// ── Campo numérico: bloqueia letras na digitação ────────────────────────────
export type NumericMode = "int" | "decimal" | "bp";

/** Remove caracteres inválidos conforme o modo (int = só dígitos; decimal = dígitos + 1 separador + sinal; bp = "120/80"). */
export function cleanNumeric(mode: NumericMode, raw: string): string {
  if (mode === "bp") {
    let v = raw.replace(/[^\d/]/g, "");
    const i = v.indexOf("/");
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\//g, "");
    return v;
  }
  if (mode === "int") return raw.replace(/[^\d]/g, "");
  // decimal (aceita vírgula ou ponto, um único separador, e sinal negativo opcional)
  let v = raw.replace(/[^\d.,-]/g, "");
  const neg = v.startsWith("-");
  v = v.replace(/-/g, "");
  const sep = v.match(/[.,]/);
  if (sep) {
    const idx = v.indexOf(sep[0]);
    v = v.slice(0, idx + 1) + v.slice(idx + 1).replace(/[.,]/g, "");
  }
  return (neg ? "-" : "") + v;
}

export function NumericInput({
  label, value, onChange, readOnly, mode = "int", placeholder, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  mode?: NumericMode;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      label={label}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
      inputMode={mode === "decimal" ? "decimal" : "numeric"}
      onChange={(e) => onChange(cleanNumeric(mode, e.target.value))}
    />
  );
}

export type BlocoKey = "triagem" | "investigacao" | "desfecho";

/** Metadados de cada etapa: título, equipe responsável e rótulo do registro profissional. */
export const STAGE_META: Record<BlocoKey, { titulo: string; equipe: string; registroLabel: string }> = {
  triagem: { titulo: "Triagem", equipe: "Equipe de Enfermagem", registroLabel: "COREN" },
  investigacao: { titulo: "Investigação", equipe: "Enfermagem / Médico", registroLabel: "COREN / CRM" },
  desfecho: { titulo: "Desfecho", equipe: "Médico", registroLabel: "CRM" },
};

/** Linha de leitura exibida quando a etapa já foi fechada. */
export function EtapaFechadaInfo({
  nome, registro, fechadoEm,
}: { nome: string; registro: string; fechadoEm?: string }) {
  return (
    <div className="mt-2 pt-4 border-t border-gray-100">
      <Text variant="caption" className="text-gray-300">
        Etapa fechada por <span className="font-semibold text-gray-400">{nome}</span>
        {registro ? ` (${registro})` : ""}
        {fechadoEm ? ` em ${new Date(fechadoEm).toLocaleString("pt-BR")}` : ""}
      </Text>
    </div>
  );
}

/** Barra com o botão de fechar a etapa (responsável já capturado antes de iniciar). */
export function FecharEtapaBar({
  submitting, onSubmit, label = "Fechar etapa →",
}: { submitting: boolean; onSubmit: () => void; label?: string }) {
  return (
    <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end">
      <Button onClick={onSubmit} disabled={submitting}>
        {submitting ? "Salvando..." : label}
      </Button>
    </div>
  );
}

/** Campo de data com o calendário azul dos formulários; vira leitura quando a etapa está fechada. */
export function DateField({
  label,
  value,
  onChange,
  readOnly,
  maxDate,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  readOnly?: boolean;
  maxDate?: string;
}) {
  if (readOnly) {
    return <Input label={label} readOnly value={value ? isoToBr(value) : ""} />;
  }
  return <DateInput label={label} value={value} onChange={onChange} maxDate={maxDate} />;
}

/** Pílula de opção única (radio) — usada para escolhas como VIA do ECG. */
export function RadioPill({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-sans font-semibold border-2 transition-colors text-left disabled:cursor-default ${
        selected
          ? "border-teal-base bg-teal-light text-teal-dark"
          : "border-gray-200 text-gray-400 hover:border-teal-light"
      }`}
    >
      {label}
    </button>
  );
}
