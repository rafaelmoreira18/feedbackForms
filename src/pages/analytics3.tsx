import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { form3Service } from "../services/form3-service";
import {
  getAverageByFormType,
  getAverageByQuestion,
  getNpsBreakdown,
  getMonthlyTrend,
  getSummaryMetrics,
  getNpsCrossForm,
} from "../services/analytics3-service";
import type { Form3Response, Form3Type } from "../types";
import { FORM3_DEPARTMENT_OPTIONS } from "./survey-form3-config";
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

export default function Analytics3() {
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState<Form3Response[]>([]);
  const [selectedDept, setSelectedDept] = useState<Form3Type | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    form3Service.getAll().then(setAllForms);
  }, []);

  const filtered = useMemo(
    () => filterByDate(allForms, startDate, endDate),
    [allForms, startDate, endDate]
  );

  const summary = useMemo(() => getSummaryMetrics(filtered), [filtered]);
  const byFormType = useMemo(() => getAverageByFormType(filtered), [filtered]);
  const byQuestion = useMemo(
    () => (selectedDept ? getAverageByQuestion(filtered, selectedDept as Form3Type) : []),
    [filtered, selectedDept]
  );
  const npsBreakdown = useMemo(() => getNpsBreakdown(filtered), [filtered]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(filtered), [filtered]);
  const npsCrossForm = useMemo(() => getNpsCrossForm(filtered), [filtered]);

  const deptOptions = [
    { value: "", label: "Todos os setores" },
    ...FORM3_DEPARTMENT_OPTIONS.map((d) => ({ value: d, label: d })),
  ];

  const hasDateFilter = !!(startDate || endDate);

  if (allForms.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Text variant="heading-md" className="text-gray-400">
              Analytics — Satisfação & Experiência por Setor
            </Text>
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        </header>
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Text variant="heading-md" className="text-gray-400">
            Analytics — Satisfação & Experiência por Setor
          </Text>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard label="Total de Respostas" value={summary.total} />
            <SummaryCard label="Média de Satisfação" value={`${summary.avgSatisfaction}/4`} />
            <SummaryCard label="Média NPS" value={`${summary.avgNps}/10`} />
            <SummaryCard label="NPS Score" value={`${summary.npsScore}`} />
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
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}/10`, "NPS Médio"]} />
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
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} name="Avaliação (1–4)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Per-department question drill-down */}
          <Card shadow="md" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <Text variant="heading-sm" className="text-gray-400">
                Avaliação por Pergunta — Análise de Setor
              </Text>
              <div className="w-full sm:w-64">
                <Select
                  label=""
                  options={deptOptions}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value as Form3Type | "")}
                />
              </div>
            </div>
            {byQuestion.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(300, byQuestion.length * 50)}>
                <BarChart data={byQuestion} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 4]} />
                  <YAxis dataKey="question" type="category" width={260} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary} name="Avaliação (1–4)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text variant="body-sm" className="text-gray-300">
                Selecione um setor para ver as avaliações por pergunta
              </Text>
            )}
          </Card>

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
                  <Tooltip />
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
                  <Tooltip />
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
