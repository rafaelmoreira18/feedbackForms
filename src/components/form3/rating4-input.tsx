import SubReasonPanel from "../sub-reason-panel";

const NOTO_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";

const RATING4_EMOJI_URLS: Record<number, string> = {
  1: `${NOTO_BASE}/1f614/512.webp`,
  2: `${NOTO_BASE}/1f610/512.webp`,
  3: `${NOTO_BASE}/1f642/512.webp`,
  4: `${NOTO_BASE}/1f601/512.webp`,
};

const RATING4_LABELS: Record<number, string> = { 1: "Ruim", 2: "Regular", 3: "Bom", 4: "Excelente" };

const RATING4_STYLES: Record<number, { active: string; inactive: string }> = {
  1: { active: "bg-red-base border-red-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base" },
  2: { active: "bg-yellow-base border-yellow-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base" },
  3: { active: "bg-teal-base border-teal-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base" },
  4: { active: "bg-green-base border-green-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base" },
};

const ANIM = `
@keyframes popIn {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.emoji-pop { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
`;

interface Rating4InputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  subReasons?: [string, string, string] | null;
  selectedReasons: string[];
  note: string;
  onReasonsChange: (reasons: string[]) => void;
  onNoteChange: (note: string) => void;
}

export default function Rating4Input({
  label, value, onChange, subReasons, selectedReasons, note, onReasonsChange, onNoteChange,
}: Rating4InputProps) {
  return (
    <>
      <style>{ANIM}</style>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-400 font-sans">{label}</p>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {[1, 2, 3, 4].map((r) => {
            const isActive = value === r;
            return (
              <button
                key={r}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(value === r ? 0 : r)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150 w-full sm:w-auto ${isActive ? RATING4_STYLES[r].active : RATING4_STYLES[r].inactive}`}
              >
                {isActive && (
                  <img key={`${r}-active`} src={RATING4_EMOJI_URLS[r]} alt={RATING4_LABELS[r]}
                    width={24} height={24} className="emoji-pop shrink-0" />
                )}
                <span>{RATING4_LABELS[r]}</span>
              </button>
            );
          })}
        </div>
        {value > 0 && value <= 2 && subReasons && (
          <SubReasonPanel
            reasons={subReasons}
            selectedReasons={selectedReasons}
            note={note}
            rating={value as 1 | 2}
            onReasonsChange={onReasonsChange}
            onNoteChange={onNoteChange}
          />
        )}
      </div>
    </>
  );
}
