import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formService } from "../services/form-service";
import type { FormResponse } from "../types";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";

export default function Analytics() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormResponse[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allForms = formService.getAll();
    setForms(allForms);
  };

  const getDepartmentData = () => {
    const departmentMap = new Map<string, { count: number; avgSatisfaction: number }>();

    forms.forEach((form) => {
      const current = departmentMap.get(form.department) || {
        count: 0,
        avgSatisfaction: 0,
      };
      departmentMap.set(form.department, {
        count: current.count + 1,
        avgSatisfaction: current.avgSatisfaction + form.overallSatisfaction,
      });
    });

    return Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      respostas: data.count,
      satisfacao: Number((data.avgSatisfaction / data.count).toFixed(1)),
    }));
  };

  const getSatisfactionDistribution = () => {
    const distribution = [
      { rating: "1 Estrela", count: 0 },
      { rating: "2 Estrelas", count: 0 },
      { rating: "3 Estrelas", count: 0 },
      { rating: "4 Estrelas", count: 0 },
      { rating: "5 Estrelas", count: 0 },
    ];

    forms.forEach((form) => {
      const index = Math.floor(form.overallSatisfaction) - 1;
      if (index >= 0 && index < 5) {
        distribution[index].count++;
      }
    });

    return distribution;
  };

  const getRecommendationData = () => {
    const wouldRecommend = forms.filter((f) => f.wouldRecommend).length;
    const wouldNotRecommend = forms.length - wouldRecommend;

    return [
      { name: "Recomendariam", value: wouldRecommend },
      { name: "Não Recomendariam", value: wouldNotRecommend },
    ];
  };

  const getAverageMetrics = () => {
    if (forms.length === 0) return [];

    const metrics = {
      medicalCare: 0,
      nursingCare: 0,
      facilities: 0,
      waitingTime: 0,
      communication: 0,
    };

    forms.forEach((form) => {
      metrics.medicalCare += form.medicalCareQuality;
      metrics.nursingCare += form.nursingCareQuality;
      metrics.facilities += form.facilitiesQuality;
      metrics.waitingTime += form.waitingTime;
      metrics.communication += form.communicationQuality;
    });

    const count = forms.length;

    return [
      { metric: "Atendimento Médico", value: Number((metrics.medicalCare / count).toFixed(1)) },
      { metric: "Enfermagem", value: Number((metrics.nursingCare / count).toFixed(1)) },
      { metric: "Instalações", value: Number((metrics.facilities / count).toFixed(1)) },
      { metric: "Tempo de Espera", value: Number((metrics.waitingTime / count).toFixed(1)) },
      { metric: "Comunicação", value: Number((metrics.communication / count).toFixed(1)) },
    ];
  };

  const getMonthlyTrend = () => {
    const monthMap = new Map<string, number>();

    forms.forEach((form) => {
      const date = new Date(form.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        mes: month,
        respostas: count,
      }));
  };

  const COLORS = {
    primary: "#4a90e2",
    success: "#52a350",
    danger: "#e74c3c",
    warning: "#f1c40f",
    purple: "#c257a4",
  };

  const PIE_COLORS = [COLORS.success, COLORS.danger];

  if (forms.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Text variant="heading-md" className="text-gray-400">
              Analytics
            </Text>
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
          <Text variant="heading-md" className="text-gray-400">
            Analytics - Business Intelligence
          </Text>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Respostas por Departamento
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="respostas" fill={COLORS.primary} name="Respostas" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Satisfação Média por Departamento
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="satisfacao" fill={COLORS.success} name="Satisfação (0-5)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Distribuição de Satisfação
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSatisfactionDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill={COLORS.warning} name="Quantidade" />
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
                    data={getRecommendationData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRecommendationData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
              <BarChart data={getAverageMetrics()} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="metric" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS.purple} name="Avaliação (0-5)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {getMonthlyTrend().length > 1 && (
            <Card shadow="md" padding="lg">
              <Text variant="heading-sm" className="text-gray-400 mb-4">
                Tendência Mensal de Respostas
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyTrend()}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">
                Total de Respostas
              </Text>
              <Text variant="heading-lg" className="text-blue-base">
                {forms.length}
              </Text>
            </Card>

            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">
                Satisfação Média Geral
              </Text>
              <Text variant="heading-lg" className="text-green-base">
                {(
                  forms.reduce((sum, f) => sum + f.overallSatisfaction, 0) / forms.length
                ).toFixed(1)}
                /5
              </Text>
            </Card>

            <Card shadow="sm" padding="md">
              <Text variant="body-sm" className="text-gray-300 mb-2">
                Taxa de Recomendação
              </Text>
              <Text variant="heading-lg" className="text-purple-base">
                {((forms.filter((f) => f.wouldRecommend).length / forms.length) * 100).toFixed(1)}%
              </Text>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
