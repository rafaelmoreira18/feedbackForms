import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { form3Service, getScaleAverage } from "../services/form3-service";
import type { Form3Response, Form3Filters, Form3Metrics } from "../types";
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

  const [forms3, setForms3] = useState<Form3Response[]>([]);
  const [filteredForms3, setFilteredForms3] = useState<Form3Response[]>([]);
  const [metrics3, setMetrics3] = useState<Form3Metrics>({
    totalResponses: 0,
    averageSatisfaction: 0,
    responsesThisMonth: 0,
    responsesLastMonth: 0,
    averageNps: 0,
  });
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

  useEffect(() => {
    const load = async () => {
      const f3Filters: Form3Filters = {
        startDate,
        endDate,
        sortSatisfaction,
        formType: form3DeptFilter || undefined,
      };
      const [all, filtered, m] = await Promise.all([
        form3Service.getAll(tenantSlug),
        form3Service.filter(tenantSlug, f3Filters),
        form3Service.getMetrics(tenantSlug, f3Filters),
      ]);
      setForms3(all);
      setFilteredForms3(filtered);
      setMetrics3(m);
    };
    load().catch((err) => {
      console.error('Dashboard load error:', err?.message || err);
      if (String(err?.message).includes('401') || String(err?.message).toLowerCase().includes('unauthorized')) {
        logout();
      }
    });
  }, [searchParams, form3DeptFilter]);

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
          <Button variant="outline" size="sm" onClick={() => navigate(`/${tenantSlug}/analytics`)}>
            Analytics
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
              value={metrics3.totalResponses}
              subtitle={hasActiveFilters ? `${forms3.length} no total` : undefined}
            />
            <MetricCard
              title="Média Satisfação (1–4)"
              value={`${metrics3.averageSatisfaction}/4`}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Média NPS (0–10)"
              value={`${metrics3.averageNps}/10`}
              subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
            />
            <MetricCard
              title="Respostas Este Mês"
              value={metrics3.responsesThisMonth}
              subtitle={`${metrics3.responsesLastMonth} no mês anterior`}
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
                  onChange={(e) =>
                    setFilters({ sortSatisfaction: e.target.value })
                  }
                />
                <Select
                  label="Setor"
                  options={[
                    { value: "", label: "Todos os setores" },
                    ...Array.from(new Set(forms3.map((f) => f.formType))).map((d) => ({ value: d, label: d })),
                  ]}
                  value={form3DeptFilter}
                  onChange={(e) => setForm3DeptFilter(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Responses Table */}
          <Form3Table forms={filteredForms3} onRowClick={(id) => navigate(`/${tenantSlug}/responses/${id}`)} />
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
                      )
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
                          <Text variant="body-sm" className="text-gray-300">{form.formType}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                avg >= 3 ? "bg-green-base" : avg >= 2 ? "bg-yellow-base" : "bg-red-base"
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
