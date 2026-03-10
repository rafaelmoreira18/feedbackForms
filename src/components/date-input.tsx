import { useState, useRef, useEffect } from "react";

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function toMidnight(iso: string) { return new Date(iso + "T12:00:00"); }
function isoFromCursorDay(y: number, m: number, day: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateInput({
  label, value, onChange, required, minDate, maxDate, error,
}: {
  label: string; value: string; onChange: (iso: string) => void;
  required?: boolean; minDate?: string; maxDate?: string; error?: string;
}) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const parsed = value ? toMidnight(value) : null;
  const min = minDate ? toMidnight(minDate) : null;
  const max = maxDate ? toMidnight(maxDate) : today; // never future

  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState({
    y: parsed?.getFullYear() ?? today.getFullYear(),
    m: parsed?.getMonth() ?? today.getMonth(),
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsed) setCursor({ y: parsed.getFullYear(), m: parsed.getMonth() });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const canPrev = !(min && cursor.y === min.getFullYear() && cursor.m <= min.getMonth());
  const canNext = !(max && cursor.y === max.getFullYear() && cursor.m >= max.getMonth());

  function prevMonth() {
    if (!canPrev) return;
    setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  }
  function nextMonth() {
    if (!canNext) return;
    setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  }

  function selectDay(day: number) {
    onChange(isoFromCursorDay(cursor.y, cursor.m, day));
    setOpen(false);
  }

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const displayLabel = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`
    : "Selecionar data";

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5 relative">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-dark font-sans">{label}</span>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border font-sans text-sm transition-all duration-200 bg-white ${
          error
            ? "border-brand-red ring-2 ring-brand-red/10"
            : open
            ? "border-teal-base ring-2 ring-teal-base/10"
            : "border-gray-200 hover:border-gray-300"
        } ${parsed ? "text-gray-400" : "text-gray-300"}`}
      >
        <span>{displayLabel}</span>
        <svg className="w-3.5 h-3.5 text-teal-dark shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {error && <span className="text-xs text-brand-red font-sans font-medium">{error}</span>}
      {required && <input tabIndex={-1} required value={value} onChange={() => {}} className="sr-only" />}

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button" onClick={prevMonth} disabled={!canPrev}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${canPrev ? "hover:bg-gray-100 text-gray-400" : "text-gray-200 cursor-default"}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="font-semibold text-gray-400 font-sans text-xs">{MONTHS_PT[cursor.m]}, {cursor.y}</span>
            <button
              type="button" onClick={nextMonth} disabled={!canNext}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${canNext ? "hover:bg-gray-100 text-gray-400" : "text-gray-200 cursor-default"}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {DAYS_PT.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-300 font-sans py-0.5">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellDate = toMidnight(isoFromCursorDay(cursor.y, cursor.m, day));
              const disabled = (min && cellDate < min) || (max && cellDate > max);
              const isSelected = parsed?.getTime() === cellDate.getTime();
              const isToday = today.getTime() === cellDate.getTime();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!disabled}
                  onClick={() => selectDay(day)}
                  className={`h-7 w-full rounded-md text-xs font-sans font-medium transition-all duration-100 ${
                    disabled
                      ? "text-gray-200 cursor-default"
                      : isSelected
                      ? "bg-teal-base text-white"
                      : isToday
                      ? "border border-teal-base text-teal-dark hover:bg-teal-light/40"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {(!max || today <= max) && (!min || today >= min) && (
            <button
              type="button"
              onClick={() => { onChange(today.toISOString().slice(0, 10)); setOpen(false); }}
              className="w-full py-1.5 rounded-lg bg-teal-base text-white text-xs font-semibold font-sans hover:bg-teal-dark transition-colors"
            >
              Hoje
            </button>
          )}
        </div>
      )}
    </div>
  );
}
