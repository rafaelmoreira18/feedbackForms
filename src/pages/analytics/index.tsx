import { useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { form3Service } from "@/services/form3-service";
import { tenantService } from "@/services/tenant-service";
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
} from "@/services/analytics3-service";
import type { Form3Response } from "@/types";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import MetricCard from "@/components/ui/metric-card";
import QuestionDrillDown from "@/components/analytics/question-drill-down";
import CustomYAxisTick from "@/components/analytics/custom-y-axis-tick";

const COLORS = {
  primary: "#4a90e2",
  success: "#52a350",
  danger: "#e74c3c",
  teal: "#2a9d8f",
};

function filterByDate(forms: Form3Response[], startDate: string, endDate: string) {
  return forms.filter((f) => {
    const d = new Date(f.createdAt);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  });
}

function questionBarColor(value: number) {
  return value >= 3.5 ? COLORS.success : value >= 2.5 ? COLORS.primary : COLORS.danger;
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
    throwOnError: false,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates", tenantSlug],
    queryFn: () => tenantService.getFormTemplates(tenantSlug),
    enabled: !!tenantSlug,
  });

  const questionTextMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    templates.forEach((tmpl) => {
      const qMap = new Map<string, string>();
      tmpl.blocks.forEach((block) => {
        block.questions.forEach((q) => qMap.set(q.questionKey, q.text));
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
  const npsBreakdown = useMemo(() => getNpsBreakdown(filtered), [filtered]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(filtered), [filtered]);
  const npsCrossForm = useMemo(() => getNpsCrossForm(filtered), [filtered]);

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

  const hasDateFilter = !!(startDate || endDate);

  const handleBarClick = useCallback(
    (dept: string) => (data: any) => {
      if (!data?.activePayload?.[0]?.payload) return;
      const detail = getQuestionDetail(filtered, dept, data.activePayload[0].payload.questionId, questionTextMap);
      if (detail) setDrillDetail(detail);
    },
    [filtered, questionTextMap]
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
                <DateInput label="Data Inicial" value={startDate} maxDate={endDate || undefined} onChange={setStartDate} />
                <DateInput label="Data Final" value={endDate} minDate={startDate || undefined} onChange={setEndDate} />
              </div>
              {hasDateFilter && (
                <Button variant="secondary" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
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
            <MetricCard title="Total de Respostas" value={summary.total} />
            <MetricCard title="Média de Satisfação" value={`${summary.avgSatisfaction}/4`} />
            <MetricCard title="Recomendariam" value={`${summary.pctRecomendaria}%`} />
          </div>

          {/* Recomendação cross-form */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-1">Recomendação — % por Setor</Text>
            <Text variant="body-sm" className="text-gray-300 mb-4">
              "Você recomendaria este serviço a um amigo ou familiar?" — % de Sim por setor
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={npsCrossForm}
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formType" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }}
                  wrapperStyle={{ opacity: 1, zIndex: 50 }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Recomendam"]}
                />
                <ReferenceLine
                  y={summary.pctRecomendaria}
                  stroke={COLORS.primary}
                  strokeDasharray="4 4"
                  label={{ value: `Média geral: ${summary.pctRecomendaria}%`, position: "insideTopRight", fontSize: 11 }}
                />
                <Bar dataKey="pctSim" fill={COLORS.teal} name="% Recomendariam" maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Average by department */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-4">Avaliação Média por Setor (Escala 1–4)</Text>
            <ResponsiveContainer width="100%" height={Math.max(120 + byFormType.length * 52, 220)}>
              <BarChart data={byFormType} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="formType" type="category" width={200} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                <Bar dataKey="value" fill={COLORS.primary} name="Avaliação (1–4)" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Per-department question drill-down */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <Text variant="heading-sm" className="text-gray-400">Avaliação por Pergunta — Análise de Setor</Text>
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
                    ...byQuestionAllDepts.map(({ dept }) => ({ value: dept, label: dept })),
                  ]}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap">
              {[
                { color: COLORS.danger, label: "Crítico (<2.5)" },
                { color: COLORS.primary, label: "Moderado (2.5–3.4)" },
                { color: COLORS.success, label: "Bom (≥3.5)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>

            {byQuestionAllDepts
              .filter(({ dept }, i) => selectedQuestionDept ? dept === selectedQuestionDept : i === 0)
              .map(({ dept, questions }) => (
                <Card key={dept} shadow="md" padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <Text variant="body-sm-bold" className="text-gray-400">{dept}</Text>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: "1px solid #4a90e2", backgroundColor: "rgba(74,144,226,0.15)", boxShadow: "0 0 8px rgba(74,144,226,0.25)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" style={{ color: "#4a90e2" }} className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#111827" }}>Clique na pergunta para análise detalhada</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(280, questions.length * 72)}>
                    <BarChart
                      data={questions}
                      layout="vertical"
                      margin={{ left: 280, right: 50, top: 4, bottom: 4 }}
                      onClick={handleBarClick(dept)}
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
                              <p style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600 }}>
                                {typeof payload[0].value === "number" ? `${payload[0].value.toFixed(2)}/4` : payload[0].value} — Avaliação média
                              </p>
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
              ))}

            {byQuestionAllDepts.length === 0 && (
              <Card shadow="sm" padding="md">
                <Text variant="body-sm" className="text-gray-300">
                  Nenhum dado disponível para exibir avaliações por pergunta
                </Text>
              </Card>
            )}
          </div>

          {/* Sim/Não breakdown por setor */}
          {npsBreakdown.length > 0 && (
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">Recomendação por Setor — Sim / Não</Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={npsBreakdown}
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formType" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                  <Legend />
                  <Bar dataKey="Sim" fill={COLORS.success} maxBarSize={60} />
                  <Bar dataKey="Não" fill={COLORS.danger} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Monthly trend */}
          {monthlyTrend.length > 1 && (
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">Tendência Mensal de Respostas</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }} wrapperStyle={{ opacity: 1, zIndex: 50 }} />
                  <Legend />
                  <Line type="monotone" dataKey="respostas" stroke={COLORS.primary} strokeWidth={2} name="Respostas" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
