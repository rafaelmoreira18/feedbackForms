import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";
import { form3Service } from "@/services/form3-service";
import { tenantService } from "@/services/tenant-service";
import { generateDashboardReport } from "@/services/report-service";
import type { Form3Filters } from "@/types";
import Text from "@/components/ui/text";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import MetricCard from "@/components/ui/metric-card";
import Form3Table from "@/components/dashboard/form3-table";
import { ModalConfirm } from "@/components/ui/modal/modal-confirm";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form3DeptFilter, setForm3DeptFilter] = useState<string>("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isHoldingAdmin = user?.role === 'holding_admin';
  const isGlobalRhAdmin = user?.role === 'rh_admin' && !user?.tenantId;
  // both holding_admin and global rh_admin can browse all tenants
  const isGlobal = isHoldingAdmin || isGlobalRhAdmin;
  const canDelete = user?.role === 'holding_admin' || user?.role === 'hospital_admin' || isGlobalRhAdmin;

  // global roles can switch tenants; hospital_admin is fixed to their own
  const [selectedSlug, setSelectedSlug] = useState<string>(user?.tenantSlug ?? "");

  const tenantSlug = isGlobal ? selectedSlug : (user?.tenantSlug ?? "");

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

  // Load all tenants for holding_admin selector
  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantService.getAll,
    enabled: isGlobal,
  });

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
  const hasActiveFilters = !!(startDate || endDate || sortSatisfaction || form3DeptFilter);

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
    setForm3DeptFilter("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId || !tenantSlug) return;
    await form3Service.deleteOne(tenantSlug, deleteTargetId);
    setDeleteTargetId(null);
    queryClient.invalidateQueries({ queryKey: ["forms3-all", tenantSlug] });
    queryClient.invalidateQueries({ queryKey: ["forms3-paginated", tenantSlug] });
    queryClient.invalidateQueries({ queryKey: ["forms3-metrics", tenantSlug] });
  };

  const deptOptions = [
    { value: "", label: "Todos os setores" },
    ...Array.from(new Set(allForms.map((f) => f.formType))).map((d) => ({ value: d, label: d })),
  ];

  const tenantOptions = [
    { value: "", label: "Selecione uma unidade..." },
    ...allTenants.map((t) => ({ value: t.slug, label: t.name })),
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
            onClick={() => {
              if (metrics && filteredForms.length > 0) {
                generateDashboardReport(filteredForms, metrics, filteredFilters, allForms.length);
              }
            }}
            disabled={!metrics || filteredForms.length === 0}
          >
            Exportar PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={logout}>Sair</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">

          {/* Tenant selector — for holding_admin and global rh_admin */}
          {isGlobal && (
            <Card shadow="sm">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <Select
                    label="Unidade"
                    options={tenantOptions}
                    value={selectedSlug}
                    onChange={(e) => {
                      setSelectedSlug(e.target.value);
                      setForm3DeptFilter("");
                      setSearchParams({}, { replace: true });
                    }}
                  />
                </div>
                {selectedSlug && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(ROUTES.analytics(selectedSlug))}
                  >
                    Ver Analytics desta unidade
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Empty state for global roles with no tenant selected */}
          {isGlobal && !selectedSlug ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Text variant="heading-sm" className="text-gray-300">Selecione uma unidade para visualizar as pesquisas</Text>
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
                onRowClick={(id) => navigate(ROUTES.response(tenantSlug, id))}
                onDelete={canDelete ? (id) => setDeleteTargetId(id) : undefined}
              />
            </>
          )}

        </div>
      </div>
    <ModalConfirm
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir pesquisa"
        description="Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
