import { useEffect } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { QuestionDetail } from "@/services/analytics3-service";
import { RATING4_CHART_COLORS } from "@/config/rating4-config";
import RatingDistributionBar from "@/components/ui/rating-distribution-bar";
import SubReasonFrequency from "@/components/analytics/sub-reason-frequency";

interface QuestionDrillDownProps {
  detail: QuestionDetail;
  onClose: () => void;
}

export default function QuestionDrillDown({ detail, onClose }: QuestionDrillDownProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const scoreColor =
    detail.avg >= 3.5 ? "text-green-base" : detail.avg >= 2.5 ? "text-yellow-base" : "text-red-base";

  const negPct =
    (detail.distribution.find((d) => d.label === "Ruim")?.pct ?? 0) +
    (detail.distribution.find((d) => d.label === "Regular")?.pct ?? 0);

  const topSubReasons = [...detail.subReasons]
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <p className="text-xs text-teal-base font-semibold uppercase tracking-wide mb-1">
              {detail.formType}
            </p>
            <h2 className="text-gray-400 text-base font-semibold leading-snug">{detail.questionText}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors shrink-0 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Score summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-3xl font-bold ${scoreColor}`}>{detail.avg.toFixed(1)}</p>
              <p className="text-gray-300 text-xs mt-1">Média /4</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-3xl font-bold text-gray-400">{detail.total}</p>
              <p className="text-gray-300 text-xs mt-1">Respostas</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-3xl font-bold text-red-base">{negPct}%</p>
              <p className="text-gray-300 text-xs mt-1">Ruim + Regular</p>
            </div>
          </div>

          {/* Rating distribution */}
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-3">Distribuição das Avaliações</p>
            <RatingDistributionBar distribution={detail.distribution} />
          </div>

          {/* Bar chart */}
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-3">Visualização em Gráfico</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={detail.distribution} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4e6f0" />
                <XAxis type="number" tick={{ fill: "#7a6e76", fontSize: 11 }} />
                <YAxis dataKey="label" type="category" width={70} tick={{ fill: "#7a6e76", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #f4e6f0", color: "#332e32" }}
                  formatter={(v: number, _: string, entry: any) => [
                    `${v} respostas (${entry.payload.pct}%)`,
                    "Quantidade",
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {detail.distribution.map((d) => (
                    <Cell key={d.label} fill={RATING4_CHART_COLORS[d.label] ?? "#4a90e2"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sub-reasons */}
          {detail.subReasons.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-sm font-semibold text-gray-400">Motivos de Insatisfação Apontados</p>
                {detail.negativeCount > 0 && (
                  <span className="text-xs text-gray-300">
                    {detail.negativeCount} paciente{detail.negativeCount !== 1 ? "s" : ""} avaliaram negativamente
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Justificativas selecionadas por quem avaliou como Ruim ou Regular
              </p>
              {detail.negativeCount === 0 ? (
                <p className="text-gray-300 text-sm italic">
                  Nenhuma avaliação negativa registrada — todas as respostas foram Bom ou Excelente.
                </p>
              ) : (
                <SubReasonFrequency subReasons={detail.subReasons} />
              )}
            </div>
          )}

          {/* Free-text notes */}
          {detail.notes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">Comentários Livres dos Pacientes</p>
              <p className="text-xs text-gray-300 mb-3">
                Texto livre digitado por quem avaliou negativamente
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {detail.notes.map((note, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-gray-400 text-sm leading-snug">"{note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight box */}
          <div className="bg-yellow-light border border-yellow-base rounded-xl p-4">
            <p className="text-xs font-semibold text-yellow-dark uppercase tracking-wide mb-2">
              Diagnóstico Automatizado
            </p>
            {detail.avg >= 3.5 ? (
              <p className="text-gray-400 text-sm">
                Este item está bem avaliado. {detail.distribution.find((d) => d.label === "Excelente")?.pct}% dos pacientes deram nota Excelente.
              </p>
            ) : detail.avg >= 2.5 ? (
              <p className="text-gray-400 text-sm">
                Avaliação moderada — há margem para melhora. {negPct}% avaliaram como Ruim ou Regular
                ({detail.negativeCount} paciente{detail.negativeCount !== 1 ? "s" : ""}).
                {topSubReasons.length > 0 && (
                  <span> Principal justificativa:{" "}
                    <strong className="text-yellow-dark">{topSubReasons[0].text}</strong>.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                <span className="text-red-base font-semibold">Atenção: </span>
                Avaliação crítica ({detail.avg.toFixed(1)}/4) —{" "}
                {detail.negativeCount} de {detail.total} pacientes ({Math.round((detail.negativeCount / detail.total) * 100)}%) avaliaram negativamente.
                {topSubReasons.length > 0 && (
                  <>
                    {" "}Principais causas:{" "}
                    <strong className="text-red-dark">
                      {topSubReasons.slice(0, 2).map((r) => `${r.text} (${r.pct}%)`).join(" · ")}
                    </strong>.
                  </>
                )}
                {detail.notes.length > 0 && (
                  <span className="text-gray-300">
                    {" "}{detail.notes.length} comentário{detail.notes.length !== 1 ? "s" : ""} livre{detail.notes.length !== 1 ? "s" : ""} registrado{detail.notes.length !== 1 ? "s" : ""}.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
