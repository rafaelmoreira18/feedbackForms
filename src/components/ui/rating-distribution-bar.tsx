import { RATING4_CHART_COLORS } from "@/config/rating4-config";
import type { QuestionDetail } from "@/services/analytics3-service";

interface RatingDistributionBarProps {
  distribution: QuestionDetail["distribution"];
}

export default function RatingDistributionBar({ distribution }: RatingDistributionBarProps) {
  return (
    <div className="space-y-2">
      {distribution.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-16 shrink-0 font-semibold">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${d.pct}%`,
                backgroundColor: RATING4_CHART_COLORS[d.label] ?? "#4a90e2",
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-16 text-right shrink-0 font-semibold">
            {d.count} ({d.pct}%)
          </span>
        </div>
      ))}
    </div>
  );
}
