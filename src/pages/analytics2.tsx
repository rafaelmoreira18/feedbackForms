import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { form2Service } from "../services/form2-service";
import {
  getAverageByCategory,
  getPatientSafetyData,
  getMonthlyTrend,
  getSummaryMetrics,
} from "../services/analytics2-service";
import type { Form2Response } from "../types";
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

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card shadow="sm" padding="md">
      <Text variant="body-sm" className="text-gray-300 mb-2">{label}</Text>
      <Text variant="heading-lg" className="text-blue-base">{value}</Text>
    </Card>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Text variant="heading-md" className="text-gray-400">Analytics — Infraestrutura e Cuidados</Text>
          <Button variant="secondary" size="sm" onClick={onBack}>Voltar ao Dashboard</Button>
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

export default function Analytics2() {
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState<Form2Response[]>([]);

  useEffect(() => {
    form2Service.getAll().then(setAllForms);
  }, []);

  const summary = useMemo(() => getSummaryMetrics(allForms), [allForms]);
  const categoryData = useMemo(() => getAverageByCategory(allForms), [allForms]);
  const safetyData = useMemo(() => getPatientSafetyData(allForms), [allForms]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(allForms), [allForms]);

  if (allForms.length === 0) {
    return <EmptyState onBack={() => navigate("/dashboard?form=form2")} />;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Text variant="heading-md" className="text-gray-400">
            Analytics — Infraestrutura e Cuidados
          </Text>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard?form=form2")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard label="Total de Respostas" value={summary.total} />
            <SummaryCard label="Média de Infraestrutura" value={`${summary.avgInfrastructure}/5`} />
            <SummaryCard label="Taxa de Identificação (Pulseira)" value={`${summary.safetyRate}%`} />
          </div>

          {/* Average by category */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-4">
              Avaliação Média por Categoria
            </Text>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="category" type="category" width={200} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.purple} name="Avaliação (1–5)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Patient safety */}
          <Card shadow="md" padding="lg">
            <Text variant="heading-sm" className="text-gray-400 mb-4">
              Segurança do Paciente — Identificação
            </Text>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={safetyData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sim" fill={COLORS.success} />
                <Bar dataKey="Não" fill={COLORS.danger} />
                <Bar dataKey="Parcialmente" fill={COLORS.warning} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

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
