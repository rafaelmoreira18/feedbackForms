interface SubReasonPanelProps {
  reasons: [string, string, string];
  selectedReasons: string[];
  note: string;
  rating: 1 | 2;
  onReasonsChange: (reasons: string[]) => void;
  onNoteChange: (note: string) => void;
}

export default function SubReasonPanel({
  reasons,
  selectedReasons,
  note,
  rating,
  onReasonsChange,
  onNoteChange,
}: SubReasonPanelProps) {
  const isRuim = rating === 1;
  const borderColor = isRuim ? 'border-red-300' : 'border-amber-300';
  const bgColor = isRuim ? 'bg-red-50' : 'bg-amber-50';
  const labelColor = isRuim ? 'text-red-700' : 'text-amber-700';

  function toggleReason(reason: string) {
    if (selectedReasons.includes(reason)) {
      onReasonsChange(selectedReasons.filter((r) => r !== reason));
    } else {
      onReasonsChange([...selectedReasons, reason]);
    }
  }

  return (
    <div className={`mt-2 rounded-2xl border-l-4 ${borderColor} ${bgColor} p-4 flex flex-col gap-4 transition-all duration-300`}>
      <p className={`text-xs font-semibold uppercase tracking-wider font-sans ${labelColor}`}>
        O que podemos melhorar?
      </p>

      <div className="flex flex-col gap-1">
        {reasons.map((reason) => {
          const isSelected = selectedReasons.includes(reason);
          return (
            <button
              key={reason}
              type="button"
              onClick={() => toggleReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-sans leading-snug transition-all duration-150 active:scale-98 ${
                isSelected
                  ? 'bg-blue-light border-blue-base text-blue-dark font-semibold'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              <span className="mr-2">{isSelected ? '✓' : '○'}</span>
              {reason}
            </button>
          );
        })}
      </div>

      <textarea
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-sans text-gray-500 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-300 transition min-h-18"
        placeholder="Observações adicionais:"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  );
}
