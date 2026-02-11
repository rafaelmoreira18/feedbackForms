import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { formService } from "../services/form-service";
import type { FormResponse, FormFilters, DashboardMetrics } from "../types";
import { formatDate, formatRating } from "../utils/format";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Button from "../components/button";
import Card from "../components/card";

function filtersFromParams(params: URLSearchParams): FormFilters {
  return {
    startDate: params.get("startDate") || "",
    endDate: params.get("endDate") || "",
    evaluatedDepartment: params.get("department") || "",
    sortSatisfaction:
      (params.get("sortSatisfaction") as "asc" | "desc") || undefined,
  };
}

function filtersToParams(filters: FormFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.evaluatedDepartment) params.set("department", filters.evaluatedDepartment);
  if (filters.sortSatisfaction)
    params.set("sortSatisfaction", filters.sortSatisfaction);
  return params;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalResponses: 0,
    averageSatisfaction: 0,
    recommendationRate: 0,
    responsesThisMonth: 0,
    responsesLastMonth: 0,
  });

  const filters = filtersFromParams(searchParams);

  const setFilters = useCallback(
    (newFilters: FormFilters) => {
      setSearchParams(filtersToParams(newFilters), { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const allForms = formService.getAll();
    setForms(allForms);
  }, []);

  useEffect(() => {
    const filtered = formService.filter(filters);
    setFilteredForms(filtered);
    setMetrics(formService.getMetrics(filtered));
  }, [searchParams, forms]);

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
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
    filters.evaluatedDepartment ||
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <Text variant="heading-md" className="text-gray-400">
            Dashboard
          </Text>
          <div className="flex items-center gap-3 flex-wrap">
            <Text variant="body-sm" className="text-gray-300 hidden sm:block">
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
              <div className="flex flex-wrap justify-between items-center gap-2">
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
                  label="Departamento Avaliado"
                  options={departments}
                  value={filters.evaluatedDepartment || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, evaluatedDepartment: e.target.value })
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
                <>
                  {/* Mobile card layout */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {filteredForms.map((form) => {
                      const avg = formService.getAverageSatisfaction(form);
                      return (
                        <div
                          key={form.id}
                          onClick={() => navigate(`/form/${form.id}`)}
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer active:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Text variant="body-sm-bold" className="text-gray-400">
                              {form.patientName}
                            </Text>
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  avg >= 4
                                    ? "bg-green-base"
                                    : avg >= 3
                                    ? "bg-yellow-base"
                                    : "bg-red-base"
                                }`}
                              />
                              <Text variant="body-sm-bold">
                                {formatRating(Math.round(avg * 10) / 10)}
                              </Text>
                            </div>
                          </div>
                          <Text variant="caption" className="text-gray-300">
                            CPF: {form.patientCpf}
                          </Text>
                          <div className="flex justify-between items-center">
                            <Text variant="body-sm" className="text-gray-300">
                              {form.evaluatedDepartment}
                            </Text>
                            <Text variant="caption" className="text-gray-300">
                              {formatDate(form.createdAt)}
                            </Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">
                            <Text variant="body-sm-bold" className="text-gray-400">
                              Nome do Paciente
                            </Text>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Text variant="body-sm-bold" className="text-gray-400">
                              Departamento Avaliado
                            </Text>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Text variant="body-sm-bold" className="text-gray-400">
                              CPF
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
                                <Text variant="body-md">{form.evaluatedDepartment}</Text>
                              </td>
                              <td className="py-3 px-4">
                                <Text variant="body-md">{form.patientCpf}</Text>
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
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
