import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formService } from "../services/form-service";
import {
  getDepartmentData, getSatisfactionDistribution, getRecommendationData,
  getAverageMetrics, getMonthlyTrend, getSummaryMetrics,
} from "../services/analytics-service";
import type { FormResponse } from "../types";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";

const COLORS = {
  primary: "#4a90e2",
  success: "#52a350",
  danger: "#e74c3c",
  warning: "#f1c40f",
  purple: "#c257a4",
};

const PIE_COLORS = [COLORS.success, COLORS.danger];

export default function Analytics() {
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState<FormResponse[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    setAllForms(formService.getAll());
  }, []);

  const filteredForms = useMemo(
    () => selectedDepartment
      ? allForms.filter((f) => f.department === selectedDepartment)
      : allForms,
    [allForms, selectedDepartment]
  );

  const departmentData = useMemo(() => getDepartmentData(allForms), [allForms]);
  const distribution = useMemo(() => getSatisfactionDistribution(filteredForms), [filteredForms]);
  const recommendation = useMemo(() => getRecommendationData(filteredForms), [filteredForms]);
  const avgMetrics = useMemo(() => getAverageMetrics(filteredForms), [filteredForms]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(filteredForms), [filteredForms]);
  const summary = useMemo(() => getSummaryMetrics(filteredForms), [filteredForms]);

  const handleBarClick = (data: { department?: string }) => {
    if (!data?.department) return;
    setSelectedDepartment(
      data.department === selectedDepartment ? null : data.department
    );
  };

  const title = selectedDepartment
    ? `Analytics - ${selectedDepartment}`
    : "Analytics - Todos os Departamentos";

  if (allForms.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Text variant="heading-md" className="text-gray-400">Analytics</Text>
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card shadow="md" className="text-center py-12">
            <Text variant="heading-sm" className="text-gray-300">
              Nenhum dado disponível ainda
            </Text>
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
          <div className="flex items-center gap-4">
            <Text variant="heading-md" className="text-gray-400">{title}</Text>
            {selectedDepartment && (
              <Button variant="outline" size="sm" onClick={() => setSelectedDepartment(null)}>
                Limpar Filtro
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">Total de Respostas</Text>
              <Text variant="heading-lg" className="text-blue-base">{summary.total}</Text>
            </Card>
            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">Satisfação Média</Text>
              <Text variant="heading-lg" className="text-green-base">{summary.avgSatisfaction}/5</Text>
            </Card>
            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">Taxa de Recomendação</Text>
              <Text variant="heading-lg" className="text-purple-base">{summary.recommendRate}%</Text>
            </Card>
          </div>

          {/* Department chart - always shows all, highlights selected */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-2">
              Respostas por Departamento
            </Text>
            <Text variant="caption" className="text-gray-300 mb-4">
              Clique em um departamento para filtrar
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="respostas"
                  name="Respostas"
                  cursor="pointer"
                  onClick={handleBarClick}
                >
                  {departmentData.map((entry) => (
                    <Cell
                      key={entry.department}
                      fill={
                        !selectedDepartment || entry.department === selectedDepartment
                          ? COLORS.primary
                          : "#d1d5db"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Filtered charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Distribuição de Satisfação
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => {
                    const total = distribution.reduce((sum, d) => sum + d.count, 0);
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                    return [`${value} (${pct}%)`, "Quantidade"];
                  }} />
                  <Legend />
                  <Bar dataKey="count" fill={COLORS.warning} name="Quantidade"
                    label={{ position: "top", formatter: (value: number) => {
                      const total = distribution.reduce((sum, d) => sum + d.count, 0);
                      return total > 0 ? `${((value / total) * 100).toFixed(0)}%` : "";
                    }}}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Taxa de Recomendação
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={recommendation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = recommendation.reduce((sum, r) => sum + r.value, 0);
                      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                      return `${name}: ${pct}%`;
                    }}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {recommendation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-4">
              Avaliação Média por Categoria
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={avgMetrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="metric" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS.purple} name="Avaliação (0-5)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

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