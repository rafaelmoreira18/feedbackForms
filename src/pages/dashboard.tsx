import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { ROUTES } from "../routes";
import { form3Service } from "../services/form3-service";
import { getScaleAverage } from "../services/analytics3-service";
import { generateDashboardReport } from "../services/report-service";
import type { Form3Response, Form3Filters } from "../types";
import { formatDate } from "../utils/format";
import Text from "../components/text";
import Select from "../components/select";
import Button from "../components/button";
import Card from "../components/card";
import DateInput from "../components/date-input";

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
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
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const tenantSlug = user?.tenantSlug ?? "";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form3DeptFilter, setForm3DeptFilter] = useState<string>("");

  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const sortSatisfaction = (searchParams.get("sortSatisfaction") as "asc" | "desc") || undefined;

  const setFilters = useCallback(
    (patch: Partial<{ startDate: string; endDate: string; sortSatisfaction: string }>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const filteredFilters: Form3Filters = {
    startDate,
    endDate,
    sortSatisfaction,
    formType: form3DeptFilter || undefined,
  };

  // All forms — used for dept dropdown options (unfiltered)
  const { data: allForms = [] } = useQuery({
    queryKey: ["forms3-all", tenantSlug],
    queryFn: () => form3Service.getAll(tenantSlug),
    enabled: !!tenantSlug,
  });

  // Filtered forms for table
  const { data: filteredPage } = useQuery({
    queryKey: ["forms3-paginated", tenantSlug, filteredFilters],
    queryFn: () => form3Service.getPaginated(tenantSlug, filteredFilters),
    enabled: !!tenantSlug,
  });

  // Metrics
  const { data: metrics } = useQuery({
    queryKey: ["forms3-metrics", tenantSlug, filteredFilters],
    queryFn: () => form3Service.getMetrics(tenantSlug, filteredFilters),
    enabled: !!tenantSlug,
  });

  const filteredForms = filteredPage?.data ?? [];
  const totalResponses = metrics?.totalResponses ?? 0;
  const averageSatisfaction = metrics?.averageSatisfaction ?? 0;
  const averageNps = metrics?.averageNps ?? 0;
  const responsesThisMonth = metrics?.responsesThisMonth ?? 0;
  const responsesLastMonth = metrics?.responsesLastMonth ?? 0;

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
    setForm3DeptFilter("");
  };

  const hasActiveFilters = !!(startDate || endDate || sortSatisfaction || form3DeptFilter);

  const satisfactionSortOptions = [
    { value: "", label: "Sem ordenação" },
    { value: "desc", label: "Maior para Menor" },
    { value: "asc", label: "Menor para Maior" },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Text variant="heading-md" className="text-gray-400">
          Dashboard
        </Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">
            {user?.name}
          </Text>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.analytics(tenantSlug))}>
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (metrics && filteredForms.length > 0) {
                generateDashboardReport(filteredForms, metrics, filteredFilters, allForms.length);
              }
            }}
            disabled={!metrics || filteredForms.length === 0}
          >
            Exportar PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Total de Respostas"
              value={totalResponses}
              subtitle={hasActiveFilters ? `${allForms.length} no total` : undefined}
            />
            <MetricCard
              title="Média Satisfação (1–4)"
              value={`${averageSatisfaction}/4`}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Média NPS (0–10)"
              value={`${averageNps}/10`}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Respostas Este Mês"
              value={responsesThisMonth}
              subtitle={`${responsesLastMonth} no mês anterior`}
            />
          </div>

          {/* Filters */}
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
                <DateInput
                  label="Data Inicial"
                  value={startDate}
                  maxDate={endDate || undefined}
                  onChange={(v) => setFilters({ startDate: v })}
                />
                <DateInput
                  label="Data Final"
                  value={endDate}
                  minDate={startDate || undefined}
                  onChange={(v) => setFilters({ endDate: v })}
                />
                <Select
                  label="Ordenar Satisfação"
                  options={satisfactionSortOptions}
                  value={sortSatisfaction || ""}
                  onChange={(e) => setFilters({ sortSatisfaction: e.target.value })}
                />
                <Select
                  label="Setor"
                  options={[
                    { value: "", label: "Todos os setores" },
                    ...Array.from(new Set(allForms.map((f) => f.formType))).map((d) => ({
                      value: d,
                      label: d,
                    })),
                  ]}
                  value={form3DeptFilter}
                  onChange={(e) => setForm3DeptFilter(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Responses Table */}
          <Form3Table
            forms={filteredForms}
            onRowClick={(id) => navigate(ROUTES.response(tenantSlug, id))}
          />
        </div>
      </div>
    </div>
  );
}

function Form3Table({
  forms,
  onRowClick,
}: {
  forms: Form3Response[];
  onRowClick: (id: string) => void;
}) {
  return (
    <Card shadow="md">
      <div className="flex flex-col gap-4">
        <Text variant="heading-sm" className="text-gray-400">
          Respostas ({forms.length})
        </Text>

        {forms.length === 0 ? (
          <div className="text-center py-12">
            <Text variant="body-md" className="text-gray-300">
              Nenhuma resposta encontrada
            </Text>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {forms.map((form) => {
                const avg = getScaleAverage(form);
                return (
                  <div
                    key={form.id}
                    onClick={() => onRowClick(form.id)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer active:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Text variant="body-sm-bold" className="text-gray-400">
                        {form.patientName}
                      </Text>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            avg >= 3 ? "bg-green-base" : avg >= 2 ? "bg-yellow-base" : "bg-red-base"
                          }`}
                        />
                        <Text variant="body-sm-bold">
                          {(Math.round(avg * 10) / 10).toFixed(1)}/4
                        </Text>
                      </div>
                    </div>
                    <Text variant="caption" className="text-gray-300">
                      {form.formType}
                    </Text>
                    <div className="flex justify-between items-center mt-1">
                      <Text variant="caption" className="text-gray-300">
                        {formatDate(form.createdAt)}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Nome do Paciente", "CPF", "Setor", "Média Satisfação", "NPS", "Data"].map(
                      (h) => (
                        <th key={h} className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            {h}
                          </Text>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => {
                    const avg = getScaleAverage(form);
                    const nps = form.answers.find((a) => a.questionId === "nps")?.value;
                    return (
                      <tr
                        key={form.id}
                        onClick={() => onRowClick(form.id)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <Text variant="body-md">{form.patientName}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-md">{form.patientCpf}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-sm" className="text-gray-300">
                            {form.formType}
                          </Text>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                avg >= 3
                                  ? "bg-green-base"
                                  : avg >= 2
                                    ? "bg-yellow-base"
                                    : "bg-red-base"
                              }`}
                            />
                            <Text variant="body-md">
                              {(Math.round(avg * 10) / 10).toFixed(1)}/4
                            </Text>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-md">{nps !== undefined ? nps : "—"}</Text>
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
  );
}
