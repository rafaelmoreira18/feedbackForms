import { RATING4_LABELS, RATING4_EMOJI_URLS, RATING4_ACTIVE_STYLES, RATING4_INACTIVE_STYLES } from "@/config/rating4-config";
import SubReasonPanel from "@/components/forms/sub-reason-panel";

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
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150 w-full sm:w-auto ${isActive ? RATING4_ACTIVE_STYLES[r] : RATING4_INACTIVE_STYLES[r]}`}
              >
                {isActive && (
                  <img
                    key={`${r}-active`}
                    src={RATING4_EMOJI_URLS[r]}
                    alt={RATING4_LABELS[r]}
                    width={24}
                    height={24}
                    className="emoji-pop shrink-0"
                  />
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
