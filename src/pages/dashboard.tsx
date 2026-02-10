import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { formService } from "../services/form-service";
import type { FormResponse, FormFilters, DashboardMetrics } from "../types";
import { formatDate, formatRating } from "../utils/format";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Button from "../components/button";
import Card from "../components/card";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalResponses: 0,
    averageSatisfaction: 0,
    recommendationRate: 0,
    responsesThisMonth: 0,
    responsesLastMonth: 0,
  });

  const [filters, setFilters] = useState<FormFilters>({
    startDate: "",
    endDate: "",
    department: "",
    sortSatisfaction: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, forms]);

  const loadData = () => {
    const allForms = formService.getAll();
    setForms(allForms);
    setFilteredForms(allForms);
    setMetrics(formService.getMetrics(allForms));
  };

  const applyFilters = () => {
    const filtered = formService.filter(filters);
    setFilteredForms(filtered);
    setMetrics(formService.getMetrics(filtered));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      department: "",
      sortSatisfaction: undefined,
    });
  };

  const departments = [
    { value: "", label: "Todos" },
    { value: "Emergência", label: "Emergência" },
    { value: "UTI", label: "UTI" },
    { value: "Internação Geral", label: "Internação Geral" },
    { value: "Cirurgia", label: "Cirurgia" },
    { value: "Pediatria", label: "Pediatria" },
    { value: "Maternidade", label: "Maternidade" },
    { value: "Oncologia", label: "Oncologia" },
  ];

  const satisfactionSortOptions = [
    { value: "", label: "Sem ordenação" },
    { value: "desc", label: "Maior para Menor" },
    { value: "asc", label: "Menor para Maior" },
  ];

  const hasActiveFilters = !!(
    filters.startDate ||
    filters.endDate ||
    filters.department ||
    filters.sortSatisfaction
  );

  const MetricCard = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <Card shadow="sm" padding="md" className="flex flex-col gap-2">
      <Text variant="body-sm" className="text-gray-300">
        {title}
      </Text>
      <Text variant="heading-lg" className="text-blue-base">
        {value}
      </Text>
      {subtitle && (
        <Text variant="caption" className="text-gray-300">
          {subtitle}
        </Text>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Text variant="heading-md" className="text-gray-400">
            Dashboard
          </Text>
          <div className="flex items-center gap-4">
            <Text variant="body-md" className="text-gray-300">
              {user?.name}
            </Text>
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              Analytics
            </Button>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total de Respostas"
              value={metrics.totalResponses}
              subtitle={hasActiveFilters ? `${forms.length} no total` : undefined}
            />
            <MetricCard
              title="Satisfação Média"
              value={formatRating(metrics.averageSatisfaction)}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Taxa de Recomendação"
              value={`${metrics.recommendationRate}%`}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Respostas Este Mês"
              value={metrics.responsesThisMonth}
              subtitle={`${metrics.responsesLastMonth} no mês anterior`}
            />
          </div>

          <Card shadow="md">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <Text variant="heading-sm" className="text-gray-400">
                  Filtros
                </Text>
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Data Inicial"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />

                <Input
                  label="Data Final"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />

                <Select
                  label="Departamento"
                  options={departments}
                  value={filters.department || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                />

                <Select
                  label="Ordenar Satisfação"
                  options={satisfactionSortOptions}
                  value={filters.sortSatisfaction || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortSatisfaction: e.target.value
                        ? (e.target.value as 'asc' | 'desc')
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          </Card>

          <Card shadow="md">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Text variant="heading-sm" className="text-gray-400">
                  Respostas ({filteredForms.length})
                </Text>
              </div>

              {filteredForms.length === 0 ? (
                <div className="text-center py-12">
                  <Text variant="body-md" className="text-gray-300">
                    Nenhuma resposta encontrada
                  </Text>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            Paciente
                          </Text>
                        </th>
                        <th className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            Departamento
                          </Text>
                        </th>
                        <th className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            Média Satisfação
                          </Text>
                        </th>
                        <th className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            Data
                          </Text>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForms.map((form) => {
                        const avg = formService.getAverageSatisfaction(form);
                        return (
                          <tr
                            key={form.id}
                            onClick={() => navigate(`/form/${form.id}`)}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <Text variant="body-md">{form.patientName}</Text>
                            </td>
                            <td className="py-3 px-4">
                              <Text variant="body-md">{form.department}</Text>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    avg >= 4
                                      ? "bg-green-base"
                                      : avg >= 3
                                      ? "bg-yellow-base"
                                      : "bg-red-base"
                                  }`}
                                />
                                <Text variant="body-md">
                                  {formatRating(Math.round(avg * 10) / 10)}
                                </Text>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Text variant="body-sm" className="text-gray-300">
                                {formatDate(form.createdAt)}
                              </Text>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}