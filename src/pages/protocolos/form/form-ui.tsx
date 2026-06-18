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

/**
 * Remove caracteres inválidos conforme o modo (int = só dígitos; decimal = dígitos +
 * 1 separador + sinal; bp = máscara "sist/diast" com no máx. 3 dígitos por lado e
 * inserção automática da barra após o 3º dígito).
 *
 * @param decimals  no modo "decimal", nº máximo de casas após o separador (ex.: 2 → "0.04").
 */
export function cleanNumeric(mode: NumericMode, raw: string, decimals?: number): string {
  if (mode === "bp") {
    // Respeita uma barra digitada explicitamente (ex.: "90/60"); senão, separa em 3+3.
    const temBarra = raw.includes("/");
    const digitos = raw.replace(/\D/g, "").slice(0, 6);
    let sist: string, diast: string;
    if (temBarra) {
      const [a = "", b = ""] = raw.split("/");
      sist = a.replace(/\D/g, "").slice(0, 3);
      diast = b.replace(/\D/g, "").slice(0, 3);
    } else {
      sist = digitos.slice(0, 3);
      diast = digitos.slice(3, 6);
    }
    // Insere a barra automaticamente assim que há 3 dígitos de sistólica (ou já digitada).
    if (diast || temBarra || sist.length === 3) return `${sist}/${diast}`;
    return sist;
  }
  if (mode === "int") return raw.replace(/[^\d]/g, "");
  // decimal (aceita vírgula ou ponto, um único separador, e sinal negativo opcional)
  let v = raw.replace(/[^\d.,-]/g, "");
  const neg = v.startsWith("-");
  v = v.replace(/-/g, "");
  const sep = v.match(/[.,]/);
  if (sep) {
    const sepChar = sep[0];
    const idx = v.indexOf(sepChar);
    const inteira = v.slice(0, idx);
    let frac = v.slice(idx + 1).replace(/[.,]/g, "");
    // Limita as casas decimais (ex.: troponina ng/mL → 2 casas).
    if (decimals !== undefined) frac = frac.slice(0, decimals);
    v = inteira + sepChar + frac;
  }
  return (neg ? "-" : "") + v;
}

/** Limita um número (int/decimal) à faixa [min,max]; "bp" não é limitado aqui. */
function clampToRange(mode: NumericMode, raw: string, min?: number, max?: number): string {
  if (mode === "bp" || raw === "" || raw === "-") return raw;
  const n = Number(raw.replace(",", "."));
  if (Number.isNaN(n)) return raw;
  if (min !== undefined && n < min) return String(min);
  if (max !== undefined && n > max) return String(max);
  return raw;
}

/**
 * Limita apenas o teto (max) durante a digitação — impede que o campo aceite
 * valores acima do máximo a cada tecla (ex.: 12222222 num campo max=1000 → 1000).
 * O piso (min) é aplicado só ao sair do campo, para não atrapalhar a digitação parcial.
 */
function clampMaxWhileTyping(mode: NumericMode, raw: string, max?: number): string {
  if (mode === "bp" || max === undefined || raw === "" || raw === "-") return raw;
  const n = Number(raw.replace(",", "."));
  if (Number.isNaN(n)) return raw;
  return n > max ? String(max) : raw;
}

export function NumericInput({
  label, value, onChange, readOnly, mode = "int", placeholder, className, min, max, hint, decimals,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  mode?: NumericMode;
  placeholder?: string;
  className?: string;
  /** Faixa válida (clamp ao sair do campo). Para PA, valide cada componente fora daqui. */
  min?: number;
  max?: number;
  /** Texto-guia exibido abaixo do campo (ex.: faixa de referência). */
  hint?: string;
  /** Modo decimal: nº máximo de casas após o separador (ex.: 2 para ng/mL). */
  decimals?: number;
}) {
  // Comprimento máximo do campo: PA = "300/200" (7); demais derivam do `max`
  // (nº de dígitos do teto + casas decimais + separador + sinal negativo).
  const casasDec = decimals ?? 2; // padrão de 2 casas quando não especificado
  const maxLen =
    mode === "bp"
      ? 7
      : max !== undefined
        ? String(Math.trunc(Math.abs(max))).length +
          (mode === "decimal" ? casasDec + 1 : 0) + // +1 do separador
          (min !== undefined && min < 0 ? 1 : 0)
        : undefined;
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <Input
        label={label}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        maxLength={maxLen}
        onChange={(e) => onChange(clampMaxWhileTyping(mode, cleanNumeric(mode, e.target.value, decimals), max))}
        onBlur={(e) => {
          if (readOnly) return;
          const clamped = clampToRange(mode, e.target.value, min, max);
          if (clamped !== value) onChange(clamped);
        }}
      />
      {hint && !readOnly && (
        <span className="text-[11px] text-gray-300 font-sans pl-0.5">{hint}</span>
      )}
    </div>
  );
}

// ── Pressão arterial: valida "sist/diast" dentro de faixas fisiológicas ──────
const BP_SIST = { min: 50, max: 300 };
const BP_DIAST = { min: 20, max: 200 };

/** true se "120/80" tem ambos os componentes dentro da faixa; "" é considerado válido (vazio). */
export function isBpValido(bp: string): boolean {
  if (!bp.trim()) return true;
  const m = /^(\d{1,3})\/(\d{1,3})$/.exec(bp.trim());
  if (!m) return false;
  const s = +m[1], d = +m[2];
  return s >= BP_SIST.min && s <= BP_SIST.max && d >= BP_DIAST.min && d <= BP_DIAST.max && s > d;
}

/** Marcador de campo obrigatório (asterisco) para reuso nos rótulos. */
export const REQ = " *";

/** Caixa que lista os campos obrigatórios ainda pendentes, exibida ao tentar fechar. */
export function PendenciasBox({ pendencias }: { pendencias: string[] }) {
  if (pendencias.length === 0) return null;
  return (
    <div className="rounded-xl bg-red-base/10 border border-red-base/30 px-4 py-3">
      <Text variant="body-sm-bold" className="text-red-base">
        Preencha os campos obrigatórios para fechar a etapa:
      </Text>
      <ul className="mt-1 list-disc list-inside">
        {pendencias.map((p) => (
          <li key={p} className="text-sm text-red-base font-sans">{p}</li>
        ))}
      </ul>
    </div>
  );
}

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

/**
 * Rodapé de uma etapa em modo rascunho (sem registro profissional para fechar):
 * os campos ficam salvos automaticamente; o fechamento exige registro (CRM/COREN).
 */
export function RascunhoNota() {
  return (
    <div className="mt-2 pt-4 border-t border-gray-100">
      <Text variant="caption" className="text-gray-300">
        ✓ Rascunho salvo automaticamente. Para <b>fechar</b> esta etapa, seu cadastro precisa de
        registro profissional (CRM/COREN).
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
