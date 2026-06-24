import { useState, useRef, useEffect } from "react";

/**
 * Seletor de hora no padrão 24h brasileiro (ex.: 22:30) — sem AM/PM.
 * Valor no formato "HH:mm". Mesmo visual do DateInput (azul/teal).
 */
export default function TimeInput({
  label, value, onChange, readOnly, error,
}: {
  label?: string;
  value: string;
  onChange: (hhmm: string) => void;
  readOnly?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [h, m] = value && /^\d{1,2}:\d{2}$/.test(value) ? value.split(":") : ["", ""];

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  function setHour(hh: string) { onChange(`${hh}:${m || "00"}`); }
  function setMinute(mm: string) { onChange(`${h || "00"}:${mm}`); setOpen(false); }

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">{label}</span>}
        <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-300 font-sans text-base">
          {value || "—"}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5 relative">
      {label && <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">{label}</span>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 font-sans text-base transition-all duration-200 bg-white ${
          error
            ? "border-brand-red ring-4 ring-brand-red/10"
            : open
            ? "border-teal-base ring-4 ring-teal-base/10"
            : "border-gray-200 hover:border-gray-300"
        } ${value ? "text-gray-400" : "text-gray-300"}`}
      >
        <span>{value || "Selecionar hora"}</span>
        <svg className="w-3.5 h-3.5 text-teal-dark shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      </button>

      {error && <span className="text-xs text-brand-red font-sans font-medium">{error}</span>}

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex gap-2">
          <div className="flex-1 flex flex-col">
            <span className="text-center text-[10px] font-semibold text-gray-300 font-sans pb-1">Hora</span>
            <div className="h-40 overflow-y-auto flex flex-col gap-1 pr-1">
              {hours.map((hh) => (
                <button
                  key={hh}
                  type="button"
                  onClick={() => setHour(hh)}
                  className={`h-7 rounded-md text-xs font-sans font-medium transition-colors ${
                    h === hh ? "bg-teal-base text-white" : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {hh}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 flex flex-col">
            <span className="text-center text-[10px] font-semibold text-gray-300 font-sans pb-1">Min</span>
            <div className="h-40 overflow-y-auto flex flex-col gap-1 pr-1">
              {minutes.map((mm) => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => setMinute(mm)}
                  className={`h-7 rounded-md text-xs font-sans font-medium transition-colors ${
                    m === mm ? "bg-teal-base text-white" : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {mm}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
