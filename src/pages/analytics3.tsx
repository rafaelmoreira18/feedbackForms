import { useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { form3Service } from "../services/form3-service";
import { tenantService } from "../services/tenant-service";
import {
  getAverageByFormType,
  getAverageByQuestion,
  getNpsBreakdown,
  getMonthlyTrend,
  getSummaryMetrics,
  getNpsCrossForm,
  getQuestionDetail,
  type QuestionDetail,
  type QuestionAvg,
} from "../services/analytics3-service";
import type { Form3Response } from "../types";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";
import Select from "../components/select";
import DateInput from "../components/date-input";

const COLORS = {
  primary: "#4a90e2",
  success: "#52a350",
  danger: "#e74c3c",
  warning: "#f1c40f",
  purple: "#c257a4",
  teal: "#2a9d8f",
};

const RATING_COLORS: Record<string, string> = {
  Ruim: "#e74c3c",
  Regular: "#f1c40f",
  Bom: "#4a90e2",
  Excelente: "#52a350",
};

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card shadow="sm" padding="md">
      <Text variant="body-sm" className="text-gray-300 mb-2">{label}</Text>
      <Text variant="heading-lg" className="text-blue-base">{value}</Text>
    </Card>
  );
}

function filterByDate(forms: Form3Response[], startDate: string, endDate: string) {
  return forms.filter((f) => {
    const d = new Date(f.createdAt);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  });
}


// Distribution bar for rating breakdown
function RatingDistributionBar({ distribution }: { distribution: QuestionDetail["distribution"] }) {
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
                backgroundColor: RATING_COLORS[d.label] ?? "#4a90e2",
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

// Sub-reason frequency bars
function SubReasonPanel({ subReasons }: { subReasons: QuestionDetail["subReasons"] }) {
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

// Full drill-down modal/panel for a clicked question
function QuestionDrillDown({
  detail,
  onClose,
}: {
  detail: QuestionDetail;
  onClose: () => void;
}) {
  const scoreColor =
    detail.avg >= 3.5 ? "text-green-base" : detail.avg >= 2.5 ? "text-yellow-base" : "text-red-base";

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
              <p className="text-3xl font-bold text-red-base">
                {(
                  (detail.distribution.find((d) => d.label === "Ruim")?.pct ?? 0) +
                  (detail.distribution.find((d) => d.label === "Regular")?.pct ?? 0)
                )}%
              </p>
              <p className="text-gray-300 text-xs mt-1">Ruim + Regular</p>
            </div>
          </div>

          {/* Rating distribution */}
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-3">Distribuição das Avaliações</p>
            <RatingDistributionBar distribution={detail.distribution} />
          </div>

          {/* Bar chart visualization */}
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
                    <Cell key={d.label} fill={RATING_COLORS[d.label] ?? "#4a90e2"} />
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
                <SubReasonPanel subReasons={detail.subReasons} />
              )}
            </div>
          )}

          {/* Free-text notes */}
          {detail.notes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">
                Comentários Livres dos Pacientes
              </p>
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
                Avaliação moderada — há margem para melhora.{" "}
                {(detail.distribution.find((d) => d.label === "Ruim")?.pct ?? 0) +
                  (detail.distribution.find((d) => d.label === "Regular")?.pct ?? 0)}% avaliaram como Ruim ou Regular
                ({detail.negativeCount} paciente{detail.negativeCount !== 1 ? "s" : ""}).
                {detail.subReasons.some((r) => r.count > 0) && (
                  <span> Principal justificativa:{" "}
                    <strong className="text-yellow-dark">
                      {[...detail.subReasons].sort((a, b) => b.count - a.count)[0]?.text}
                    </strong>.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                <span className="text-red-base font-semibold">Atenção: </span>
                Avaliação crítica ({detail.avg.toFixed(1)}/4) —{" "}
                {detail.negativeCount} de {detail.total} pacientes ({Math.round((detail.negativeCount / detail.total) * 100)}%) avaliaram negativamente.
                {detail.subReasons.some((r) => r.count > 0) && (
                  <>
                    {" "}Principais causas:{" "}
                    <strong className="text-red-dark">
                      {[...detail.subReasons]
                        .filter((r) => r.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 2)
                        .map((r) => `${r.text} (${r.pct}%)`)
                        .join(" · ")}
                    </strong>.
                  </>
                )}
                {detail.notes.length > 0 && (
                  <span className="text-gray-300"> {detail.notes.length} comentário{detail.notes.length !== 1 ? "s" : ""} livre{detail.notes.length !== 1 ? "s" : ""} registrado{detail.notes.length !== 1 ? "s" : ""}.</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Y-axis tick that wraps text
function CustomYAxisTick({
  x,
  y,
  payload,
  width = 220,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number;
}) {
  if (!payload?.value) return null;
  const text = payload.value;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  const charsPerLine = Math.floor(width / 7);

  words.forEach((word) => {
    if ((line + word).length > charsPerLine) {
      if (line) lines.push(line.trim());
      line = word + " ";
    } else {
      line += word + " ";
    }
  });
  if (line.trim()) lines.push(line.trim());

  const lineHeight = 14;
  const totalHeight = lines.length * lineHeight;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((l, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={i * lineHeight - totalHeight / 2 + lineHeight / 2}
          textAnchor="end"
          fill="#9ca3af"
          fontSize={10}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

export default function Analytics3() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drillDetail, setDrillDetail] = useState<QuestionDetail | null>(null);
  const [selectedQuestionDept, setSelectedQuestionDept] = useState<string>("");

  const { data: allForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ["forms3", tenantSlug],
    queryFn: () => form3Service.getAll(tenantSlug),
    enabled: !!tenantSlug,
    throwOnError: (err) => { toast.error(`Erro ao carregar respostas: ${(err as Error).message}`); return false; },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates", tenantSlug],
    queryFn: () => tenantService.getFormTemplates(tenantSlug),
    enabled: !!tenantSlug,
  });

  // Build a map: formSlug -> questionKey -> full question text
  const questionTextMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    templates.forEach((tmpl) => {
      const qMap = new Map<string, string>();
      tmpl.blocks.forEach((block) => {
        block.questions.forEach((q) => {
          qMap.set(q.questionKey, q.text);
        });
      });
      map.set(tmpl.slug, qMap);
    });
    return map;
  }, [templates]);

  const filtered = useMemo(
    () => filterByDate(allForms, startDate, endDate),
    [allForms, startDate, endDate]
  );

  const summary = useMemo(() => getSummaryMetrics(filtered), [filtered]);
  const byFormType = useMemo(() => getAverageByFormType(filtered), [filtered]);

  // Derive department slugs from actual response data — no hardcoded list
  const deptSlugs = useMemo(
    () => Array.from(new Set(filtered.map((f) => f.formType))),
    [filtered]
  );

  const byQuestionAllDepts = useMemo(
    () =>
      deptSlugs
        .map((dept) => ({ dept, questions: getAverageByQuestion(filtered, dept, questionTextMap) }))
        .filter((d) => d.questions.length > 0),
    [filtered, deptSlugs, questionTextMap]
  );
  const npsBreakdown = useMemo(() => getNpsBreakdown(filtered), [filtered]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(filtered), [filtered]);
  const npsCrossForm = useMemo(() => getNpsCrossForm(filtered), [filtered]);

  const hasDateFilter = !!(startDate || endDate);

  const handleBarClick = useCallback(
    (dept: string) => (data: any) => {
      if (!data?.activePayload?.[0]?.payload) return;
      const detail = getQuestionDetail(filtered, dept, data.activePayload[0].payload.questionId, questionTextMap);
      if (detail) setDrillDetail(detail);
    },
    [filtered]
  );

  if (formsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allForms.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card shadow="md" className="text-center py-12">
            <Text variant="heading-sm" className="text-gray-300">Nenhum dado disponível ainda</Text>
            <Text variant="body-md" className="text-gray-300 mt-2">
              Preencha algumas pesquisas para visualizar as análises
            </Text>
          </Card>
        </div>
      </div>
    );
  }

  // Bar fill color based on score
  const questionBarColor = (value: number) =>
    value >= 3.5 ? COLORS.success : value >= 2.5 ? COLORS.primary : COLORS.danger;

  return (
    <div className="min-h-screen">
      {drillDetail && (
        <QuestionDrillDown detail={drillDetail} onClose={() => setDrillDetail(null)} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Date filter */}
          <Card shadow="sm" padding="md">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Text variant="body-sm-bold" className="text-gray-400 shrink-0 self-center">
                Filtrar por período:
              </Text>
              <div className="flex flex-wrap gap-4 flex-1">
                <DateInput
                  label="Data Inicial"
                  value={startDate}
                  maxDate={endDate || undefined}
                  onChange={(v) => setStartDate(v)}
                />
                <DateInput
                  label="Data Final"
                  value={endDate}
                  minDate={startDate || undefined}
                  onChange={(v) => setEndDate(v)}
                />
              </div>
              {hasDateFilter && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                >
                  Limpar filtro
                </Button>
              )}
            </div>
            {hasDateFilter && (
              <Text variant="caption" className="text-gray-300 mt-2">
                Exibindo {filtered.length} de {allForms.length} respostas
              </Text>
            )}
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard label="Total de Respostas" value={summary.total} />
            <SummaryCard label="Média de Satisfação" value={`${summary.avgSatisfaction}/4`} />
            <SummaryCard label="Média NPS" value={`${summary.avgNps}/10`} />
          </div>

          {/* NPS cross-form */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-1">
              NPS — Média por Setor
            </Text>
            <Text variant="body-sm" className="text-gray-300 mb-4">
              "De 0 a 10, qual a probabilidade de você recomendar este serviço para um amigo ou familiar?" — média global e por setor
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={npsCrossForm} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formType" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }}
                  formatter={(value: number) => [`${value.toFixed(1)}/10`, "NPS Médio"]}
                />
                <ReferenceLine y={summary.avgNps} stroke={COLORS.primary} strokeDasharray="4 4" label={{ value: `Média geral: ${summary.avgNps}`, position: "insideTopRight", fontSize: 11 }} />
                <Bar dataKey="avgNps" fill={COLORS.teal} name="NPS Médio (0–10)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Average by department */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-4">
              Avaliação Média por Setor (Escala 1–4)
            </Text>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byFormType} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="formType" type="category" width={200} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                <Bar dataKey="value" fill={COLORS.primary} name="Avaliação (1–4)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Per-department question drill-down — one chart per dept */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <Text variant="heading-sm" className="text-gray-400">
                  Avaliação por Pergunta — Análise de Setor
                </Text>
                <Text variant="caption" className="text-gray-400 mt-1">
                  Clique em uma barra para ver análise detalhada com distribuição de notas e motivos de insatisfação
                </Text>
              </div>
              <div className="shrink-0 w-full sm:w-72">
                <Select
                  label="Setor"
                  value={selectedQuestionDept}
                  onChange={(e) => setSelectedQuestionDept(e.target.value)}
                  options={[
                    { value: "", label: "Selecione um setor..." },
                    ...byQuestionAllDepts.map(({ dept }: { dept: string }) => ({ value: dept, label: dept })),
                  ]}
                />
              </div>
            </div>

            {/* Shared legend */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.danger }} />
                <span className="text-xs text-gray-400">Crítico (&lt;2.5)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.primary }} />
                <span className="text-xs text-gray-400">Moderado (2.5–3.4)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.success }} />
                <span className="text-xs text-gray-400">Bom (≥3.5)</span>
              </div>
            </div>

            {byQuestionAllDepts
              .filter(({ dept }: { dept: string }, i: number) =>
                selectedQuestionDept ? dept === selectedQuestionDept : i === 0
              )
              .map(({ dept, questions }: { dept: string; questions: QuestionAvg[] }) => {
                const onClick = handleBarClick(dept);
                return (
                  <Card key={dept} shadow="md" padding="lg">
                    <Text variant="body-sm-bold" className="text-gray-400 mb-4">{dept}</Text>
                    <ResponsiveContainer width="100%" height={Math.max(280, questions.length * 72)}>
                      <BarChart
                        data={questions}
                        layout="vertical"
                        margin={{ left: 280, right: 50, top: 4, bottom: 4 }}
                        onClick={onClick}
                        style={{ cursor: "pointer" }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="questionShort"
                          type="category"
                          width={275}
                          tick={(props) => <CustomYAxisTick {...props} width={270} />}
                        />
                        <Tooltip
                          wrapperStyle={{ opacity: 1, zIndex: 50, maxWidth: 320 }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const q = payload[0].payload as QuestionAvg;
                            return (
                              <div style={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px", maxWidth: 320 }}>
                                <p style={{ color: "#d1d5db", fontSize: 12, marginBottom: 6, lineHeight: 1.5, whiteSpace: "normal", wordBreak: "break-word" }}>{q.question}</p>
                                <p style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600 }}>{typeof payload[0].value === 'number' ? `${payload[0].value.toFixed(2)}/4` : payload[0].value} — Avaliação média</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" name="Avaliação (1–4)" radius={[0, 4, 4, 0]}>
                          {questions.map((q: QuestionAvg) => (
                            <Cell key={q.questionId} fill={questionBarColor(q.value)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                );
              })}

            {byQuestionAllDepts.length === 0 && (
              <Card shadow="sm" padding="md">
                <Text variant="body-sm" className="text-gray-300">
                  Nenhum dado disponível para exibir avaliações por pergunta
                </Text>
              </Card>
            )}
          </div>

          {/* NPS breakdown (promoters/neutrals/detractors) */}
          {npsBreakdown.length > 0 && (
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                NPS por Setor — Promotores / Neutros / Detratores
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={npsBreakdown} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formType" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                  <Legend />
                  <Bar dataKey="Promotores" fill={COLORS.success} />
                  <Bar dataKey="Neutros" fill={COLORS.warning} />
                  <Bar dataKey="Detratores" fill={COLORS.danger} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Monthly trend */}
          {monthlyTrend.length > 1 && (
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Tendência Mensal de Respostas
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="respostas"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Respostas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
