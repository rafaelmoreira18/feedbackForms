import type { QuestionDetail } from "@/services/analytics3-service";

interface SubReasonFrequencyProps {
  subReasons: QuestionDetail["subReasons"];
}

export default function SubReasonFrequency({ subReasons }: SubReasonFrequencyProps) {
  const hasData = subReasons.some((r) => r.count > 0);

  if (!hasData) {
    return (
      <p className="text-gray-300 text-sm italic mt-2">
        Nenhum motivo de insatisfação registrado (avaliações foram Bom ou Excelente).
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {subReasons.map((r, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="text-sm text-gray-400 flex-1 leading-snug">{r.text}</span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-base transition-all duration-500"
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className="text-xs text-red-base font-semibold w-14 text-right">
              {r.count}× ({r.pct}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
