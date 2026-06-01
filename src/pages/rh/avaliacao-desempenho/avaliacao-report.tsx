import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { PerformanceEvaluation, PerformanceAnswer } from "@/types";
import { COMPETENCIES, COMPETENCIES_BY_GROUP } from "./competencies";

const GESTOR_COLOR = "#2962ff"; // blue
const COLAB_COLOR = "#14b8a6"; // teal

function valueOf(answers: PerformanceAnswer[] | null, competenciaId: string): number | null {
  const a = answers?.find((x) => x.competenciaId === competenciaId);
  return a ? a.valor : null;
}

function average(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

export function AvaliacaoReport({ evaluation }: { evaluation: PerformanceEvaluation }) {
  const { managerAnswers, selfAnswers } = evaluation;

  // Radar por grupo (5 eixos) — média das competências de cada grupo
  const radarData = COMPETENCIES_BY_GROUP.map(({ grupo, items }) => ({
    grupo,
    Gestor: Number(average(items.map((c) => valueOf(managerAnswers, c.id))).toFixed(1)),
    Colaborador: Number(average(items.map((c) => valueOf(selfAnswers, c.id))).toFixed(1)),
  }));

  const mediaGestor = average(COMPETENCIES.map((c) => valueOf(managerAnswers, c.id)));
  const mediaColab = average(COMPETENCIES.map((c) => valueOf(selfAnswers, c.id)));

  return (
    <div className="flex flex-col gap-8">
      {/* Métricas gerais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Média Gestor</p>
          <p className="text-3xl font-bold" style={{ color: GESTOR_COLOR }}>
            {mediaGestor.toFixed(1)}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-teal-100 bg-teal-50/50 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Autoavaliação</p>
          <p className="text-3xl font-bold" style={{ color: COLAB_COLOR }}>
            {mediaColab.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Radar */}
      <div className="rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-semibold text-gray-400 mb-2 text-center">
          Comparativo por grupo de competências (0–10)
        </p>
        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="grupo" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Radar
                name="Gestor"
                dataKey="Gestor"
                stroke={GESTOR_COLOR}
                fill={GESTOR_COLOR}
                fillOpacity={0.25}
              />
              <Radar
                name="Colaborador"
                dataKey="Colaborador"
                stroke={COLAB_COLOR}
                fill={COLAB_COLOR}
                fillOpacity={0.25}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalhe por competência */}
      <div className="flex flex-col gap-5">
        <p className="text-sm font-semibold text-gray-400">Notas por competência</p>
        {COMPETENCIES_BY_GROUP.map(({ grupo, items }) => (
          <div key={grupo} className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-base">{grupo}</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {/* header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-400">
                <span>Competência</span>
                <span className="w-14 text-center">Gestor</span>
                <span className="w-14 text-center">Colab.</span>
              </div>
              {items.map((c) => {
                const g = valueOf(managerAnswers, c.id);
                const s = valueOf(selfAnswers, c.id);
                const just = managerAnswers?.find((a) => a.competenciaId === c.id)?.justificativa;
                return (
                  <div key={c.id} className="border-t border-gray-100 px-3 py-2">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <span className="text-sm text-gray-500">{c.label}</span>
                      <span className="w-14 text-center text-sm font-bold" style={{ color: GESTOR_COLOR }}>
                        {g ?? "—"}
                      </span>
                      <span className="w-14 text-center text-sm font-bold" style={{ color: COLAB_COLOR }}>
                        {s ?? "—"}
                      </span>
                    </div>
                    {just && (
                      <p className="text-xs text-gray-300 mt-1 italic">"{just}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
