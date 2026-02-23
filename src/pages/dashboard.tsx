import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { formService } from "../services/form-service";
import { form2Service } from "../services/form2-service";
import type { FormResponse, FormFilters, DashboardMetrics, Form2Response, Form2Filters } from "../types";
import { formatDate, formatRating, formatDateTime } from "../utils/format";
import { generateDashboardReport } from "../services/report-service";
import type { ReportData } from "../types/report";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Button from "../components/button";
import Card from "../components/card";

type ActiveForm = "form1" | "form2";

function filtersFromParams(params: URLSearchParams): FormFilters & Form2Filters {
  return {
    startDate: params.get("startDate") || "",
    endDate: params.get("endDate") || "",
    sortSatisfaction:
      (params.get("sortSatisfaction") as "asc" | "desc") || undefined,
  };
}

function filtersToParams(filters: FormFilters | Form2Filters, activeForm: ActiveForm): URLSearchParams {
  const params = new URLSearchParams();
  params.set("form", activeForm);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.sortSatisfaction)
    params.set("sortSatisfaction", filters.sortSatisfaction);
  return params;
}

function SatisfactionDot({ avg }: { avg: number }) {
  return (
    <div
      className={`w-2 h-2 rounded-full ${
        avg >= 4 ? "bg-green-base" : avg >= 3 ? "bg-yellow-base" : "bg-red-base"
      }`}
    />
  );
}

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeForm = (searchParams.get("form") as ActiveForm) || "form1";

  // Form 1 state
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalResponses: 0,
    averageSatisfaction: 0,
    recommendationRate: 0,
    responsesThisMonth: 0,
    responsesLastMonth: 0,
  });

  // Form 2 state
  const [forms2, setForms2] = useState<Form2Response[]>([]);
  const [filteredForms2, setFilteredForms2] = useState<Form2Response[]>([]);
  const [metrics2, setMetrics2] = useState({
    totalResponses: 0,
    averageSatisfaction: 0,
    responsesThisMonth: 0,
    responsesLastMonth: 0,
  });

  const filters = filtersFromParams(searchParams);

  const setFilters = useCallback(
    (newFilters: FormFilters | Form2Filters) => {
      setSearchParams(filtersToParams(newFilters, activeForm), { replace: true });
    },
    [setSearchParams, activeForm],
  );

  const setActiveForm = useCallback(
    (form: ActiveForm) => {
      setSearchParams(filtersToParams({}, form), { replace: true });
    },
    [setSearchParams],
  );

  // Load Form 1
  useEffect(() => {
    formService.getAll().then(setForms);
  }, []);

  useEffect(() => {
    if (activeForm !== "form1") return;
    const load = async () => {
      const filtered = await formService.filter(filters);
      setFilteredForms(filtered);
      const m = await formService.getMetrics(filters);
      setMetrics(m);
    };
    load();
  }, [searchParams, forms]);

  // Load Form 2
  useEffect(() => {
    form2Service.getAll().then(setForms2);
  }, []);

  useEffect(() => {
    if (activeForm !== "form2") return;
    const load = async () => {
      const filtered = await form2Service.filter(filters);
      setFilteredForms2(filtered);
      const m = await form2Service.getMetrics(filters);
      setMetrics2(m);
    };
    load();
  }, [searchParams, forms2]);

  const clearFilters = () => {
    setSearchParams({ form: activeForm }, { replace: true });
  };

  const satisfactionSortOptions = [
    { value: "", label: "Sem ordenação" },
    { value: "desc", label: "Maior para Menor" },
    { value: "asc", label: "Menor para Maior" },
  ];

  const hasActiveFilters = !!(
    filters.startDate ||
    filters.endDate ||
    filters.sortSatisfaction
  );

  const handleExportReport = () => {
    if (activeForm === "form1") {
      const reportData: ReportData = {
        metrics,
        filters,
        responses: filteredForms,
        generatedAt: formatDateTime(new Date()),
        totalFormsCount: forms.length,
      };
      generateDashboardReport(reportData);
    }
  };

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
          {activeForm === "form1" && (
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              Exportar PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(activeForm === "form2" ? "/analytics2" : "/analytics")}
          >
            Analytics
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Form Selector */}
          <Card shadow="sm" padding="md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Text variant="body-sm-bold" className="text-gray-400 shrink-0">
                Visualizando:
              </Text>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveForm("form1")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeForm === "form1"
                      ? "bg-blue-base text-white"
                      : "bg-gray-200 text-gray-300 hover:bg-gray-300"
                  }`}
                >
                  Formulário 1 — Satisfação e Experiência
                </button>
                <button
                  type="button"
                  onClick={() => setActiveForm("form2")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeForm === "form2"
                      ? "bg-blue-base text-white"
                      : "bg-gray-200 text-gray-300 hover:bg-gray-300"
                  }`}
                >
                  Formulário 2 — Infraestrutura e Cuidados
                </button>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          {activeForm === "form1" ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Total de Respostas"
                value={metrics2.totalResponses}
                subtitle={hasActiveFilters ? `${forms2.length} no total` : undefined}
              />
              <MetricCard
                title="Média Geral (Infraestrutura)"
                value={formatRating(metrics2.averageSatisfaction)}
                subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
              />
              <MetricCard
                title="Respostas Este Mês"
                value={metrics2.responsesThisMonth}
                subtitle={`${metrics2.responsesLastMonth} no mês anterior`}
              />
            </div>
          )}

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  label="Ordenar Satisfação"
                  options={satisfactionSortOptions}
                  value={filters.sortSatisfaction || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortSatisfaction: e.target.value
                        ? (e.target.value as "asc" | "desc")
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Responses Table */}
          {activeForm === "form1" ? (
            <Form1Table forms={filteredForms} onRowClick={(id) => navigate(`/form/${id}`)} />
          ) : (
            <Form2Table forms={filteredForms2} onRowClick={(id) => navigate(`/form2/${id}`)} />
          )}
        </div>
      </div>
    </div>
  );
}

function Form1Table({
  forms,
  onRowClick,
}: {
  forms: FormResponse[];
  onRowClick: (id: string) => void;
}) {
  return (
    <Card shadow="md">
      <div className="flex flex-col gap-4">
        <Text variant="heading-sm" className="text-gray-400">
          Respostas — Formulário 1 ({forms.length})
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
                const avg = formService.getAverageSatisfaction(form);
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
                            avg >= 4 ? "bg-green-base" : avg >= 3 ? "bg-yellow-base" : "bg-red-base"
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
                    {["Nome do Paciente", "CPF", "Média Satisfação", "Data"].map(
                      (h) => (
                        <th key={h} className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            {h}
                          </Text>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => {
                    const avg = formService.getAverageSatisfaction(form);
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
                          <div className="flex items-center gap-2">
                            <SatisfactionDot avg={avg} />
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
  );
}

function Form2Table({
  forms,
  onRowClick,
}: {
  forms: Form2Response[];
  onRowClick: (id: string) => void;
}) {
  return (
    <Card shadow="md">
      <div className="flex flex-col gap-4">
        <Text variant="heading-sm" className="text-gray-400">
          Respostas — Formulário 2 ({forms.length})
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
                const avg = form2Service.getAverageInfrastructure(form);
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
                            avg >= 4 ? "bg-green-base" : avg >= 3 ? "bg-yellow-base" : "bg-red-base"
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
                    {["Nome do Paciente", "CPF", "Média Infraestrutura", "Data"].map(
                      (h) => (
                        <th key={h} className="text-left py-3 px-4">
                          <Text variant="body-sm-bold" className="text-gray-400">
                            {h}
                          </Text>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => {
                    const avg = form2Service.getAverageInfrastructure(form);
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
                          <div className="flex items-center gap-2">
                            <SatisfactionDot avg={avg} />
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
  );
}
