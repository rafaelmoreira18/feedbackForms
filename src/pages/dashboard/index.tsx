import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";
import { form3Service } from "@/services/form3-service";
import { generateDashboardReport } from "@/services/report-service";
import type { Form3Filters } from "@/types";
import Text from "@/components/ui/text";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import MetricCard from "@/components/ui/metric-card";
import Form3Table from "@/components/dashboard/form3-table";
import Pagination from "@/components/ui/pagination";

const PAGE_SIZE = 50;

export default function Dashboard() {
  const { user, logout, activeTenantSlug } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form3DeptFilter, setForm3DeptFilter] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const isHoldingAdmin = user?.role === 'holding_admin';
  const isGlobalRhAdmin = user?.role === 'rh_admin' && !user?.tenantId;
  const isGlobal = isHoldingAdmin || isGlobalRhAdmin;

  // global roles use activeTenantSlug from context (persisted); fixed roles use their own
  const tenantSlug = isGlobal ? activeTenantSlug : (user?.tenantSlug ?? "");

  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const sortSatisfaction = (searchParams.get("sortSatisfaction") as "asc" | "desc") || undefined;
  const currentPage = Number(searchParams.get("page") || "1");

  const setFilters = useCallback(
    (patch: Partial<{ startDate: string; endDate: string; sortSatisfaction: string }>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      // Reset to page 1 whenever filters change
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(page));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const filteredFilters: Form3Filters = {
    startDate,
    endDate,
    sortSatisfaction,
    formType: form3DeptFilter || undefined,
    page: currentPage,
  };

  const { data: allForms = [] } = useQuery({
    queryKey: ["forms3-all", tenantSlug],
    queryFn: () => form3Service.getAll(tenantSlug),
    enabled: !!tenantSlug,
  });

  const { data: filteredPage } = useQuery({
    queryKey: ["forms3-paginated", tenantSlug, filteredFilters],
    queryFn: () => form3Service.getPaginated(tenantSlug, filteredFilters),
    enabled: !!tenantSlug,
  });

  const { data: metrics } = useQuery({
    queryKey: ["forms3-metrics", tenantSlug, filteredFilters],
    queryFn: () => form3Service.getMetrics(tenantSlug, filteredFilters),
    enabled: !!tenantSlug,
  });

  const filteredForms = filteredPage?.data ?? [];
  const totalFiltered = filteredPage?.total ?? 0;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  const hasActiveFilters = !!(startDate || endDate || sortSatisfaction || form3DeptFilter);

  const clearFilters = () => {
    setSearchParams({ page: "1" }, { replace: true });
    setForm3DeptFilter("");
  };

  const handleExportPdf = async () => {
    if (!metrics) return;
    setIsExporting(true);
    try {
      const allFiltered = await form3Service.getAllForReport(tenantSlug, {
        startDate,
        endDate,
        sortSatisfaction,
        formType: form3DeptFilter || undefined,
      });
      generateDashboardReport(allFiltered, metrics, filteredFilters, allForms.length);
    } finally {
      setIsExporting(false);
    }
  };

  const deptOptions = [
    { value: "", label: "Todos os setores" },
    ...Array.from(new Set(allForms.map((f) => f.formType))).map((d) => ({ value: d, label: d })),
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Text variant="heading-md" className="text-gray-400">Dashboard</Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">{user?.name}</Text>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.analytics(tenantSlug))} disabled={!tenantSlug}>
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExporting || !metrics || totalFiltered === 0}
          >
            {isExporting ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>Sair</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Empty state for global roles with no tenant selected */}
          {isGlobal && !tenantSlug ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Text variant="heading-sm" className="text-gray-300">Selecione uma unidade no menu superior para visualizar as pesquisas</Text>
            </div>
          ) : (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <MetricCard
                  title="Total de Respostas"
                  value={metrics?.totalResponses ?? 0}
                  subtitle={hasActiveFilters ? `${allForms.length} no total` : undefined}
                />
                <MetricCard
                  title="Média Satisfação (1–4)"
                  value={`${metrics?.averageSatisfaction ?? 0}/4`}
                  subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
                />
                <MetricCard
                  title="Recomendariam"
                  value={`${metrics?.averageNps ?? 0}%`}
                  subtitle={hasActiveFilters ? "Baseado nos filtros ativos" : undefined}
                />
                <MetricCard
                  title="Respostas Este Mês"
                  value={metrics?.responsesThisMonth ?? 0}
                  subtitle={`${metrics?.responsesLastMonth ?? 0} no mês anterior`}
                />
              </div>

              {/* Filters */}
              <Card shadow="md">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <Text variant="heading-sm" className="text-gray-400">Filtros</Text>
                    <Button variant="secondary" size="sm" onClick={clearFilters}>Limpar Filtros</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DateInput label="Data Inicial" value={startDate} maxDate={endDate || undefined} onChange={(v) => setFilters({ startDate: v })} />
                    <DateInput label="Data Final" value={endDate} minDate={startDate || undefined} onChange={(v) => setFilters({ endDate: v })} />
                    <Select
                      label="Ordenar Satisfação"
                      options={[
                        { value: "", label: "Sem ordenação" },
                        { value: "desc", label: "Maior para Menor" },
                        { value: "asc", label: "Menor para Maior" },
                      ]}
                      value={sortSatisfaction || ""}
                      onChange={(e) => setFilters({ sortSatisfaction: e.target.value })}
                    />
                    <Select
                      label="Setor"
                      options={deptOptions}
                      value={form3DeptFilter}
                      onChange={(e) => setForm3DeptFilter(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Responses Table */}
              <Form3Table
                forms={filteredForms}
                total={totalFiltered}
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                onRowClick={(id) => navigate(ROUTES.response(tenantSlug, id))}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
