import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { trainingService } from "@/services/training-service";
import { tenantService } from "@/services/tenant-service";
import type { TrainingSession } from "@/types";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Select from "@/components/ui/select";
import MetricCard from "@/components/ui/metric-card";
import { SessionForm, ConfirmDelete } from "./session-form-modal";
import { ResponsesPanel } from "./session-detail";
import { PairedSessionCard, SessionCard, groupSessions } from "./session-table";

export default function Treinamentos() {
  const { tenantSlug: slugFromUrl = "" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGlobalAdmin = user?.role === "holding_admin";

  const isGlobal = !slugFromUrl;
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl;

  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<TrainingSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingSession | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const canCreate = user?.role === "rh_admin" || user?.role === "holding_admin";

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants-all-active"],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal,
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["training-sessions", tenantSlug],
    queryFn: () => trainingService.getSessions(tenantSlug),
    enabled: !!tenantSlug,
  });

  const { data: sessionMetrics } = useQuery({
    queryKey: ["training-metrics", tenantSlug, selectedSession?.slug],
    queryFn: () => trainingService.getMetrics(tenantSlug, { session: selectedSession!.slug }),
    enabled: !!tenantSlug && !!selectedSession,
  });

  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: (session: TrainingSession) =>
      trainingService.updateSession(tenantSlug, session.slug, { active: !session.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] }),
  });

  const createEficacia = useMutation({
    mutationFn: (reacaoSlug: string) => trainingService.createEficacia(tenantSlug, reacaoSlug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] }),
  });

  const { groups, standalone } = useMemo(() => groupSessions(sessions), [sessions]);

  useEffect(() => {
    const slug = searchParams.get('session')
    if (!slug || sessions.length === 0) return
    const found = sessions.find(s => s.slug === slug)
    if (found) setSelectedSession(found)
  }, [sessions, searchParams]);

  const selectedGroup = useMemo(() => {
    if (!selectedSession) return null;
    return (
      groups.find(
        (g) => g.reacao.id === selectedSession.id || g.eficacia?.id === selectedSession.id,
      ) ?? null
    );
  }, [selectedSession, groups]);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${tenantSlug}/treinamento/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(slug);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const tenantOptions = [
    { value: "", label: "Selecione uma unidade..." },
    ...allTenants.map((t) => ({ value: t.slug, label: t.name })),
  ];

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession((prev) => (prev?.id === session.id ? null : session));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Text variant="heading-md" className="text-gray-400">
          Pesquisas de Treinamento
        </Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">
            {user?.name}
          </Text>
          <Button size="sm" onClick={() => setShowCreate(true)} disabled={!tenantSlug}>
            + Nova Pesquisa
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(
            tenantSlug ? ROUTES.rhHub(tenantSlug) : ROUTES.rhHubGlobal
          )}>
            ← RH
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isGlobal && (
          <Card shadow="sm" className="mb-8">
            <Select
              label="Unidade"
              options={tenantOptions}
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setSelectedSession(null);
              }}
            />
          </Card>
        )}

        {isGlobal && !tenantSlug ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Text variant="heading-sm" className="text-gray-300">
              Selecione uma unidade para visualizar as pesquisas
            </Text>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <span className="text-5xl">📋</span>
              <Text variant="heading-sm" className="text-gray-300">Nenhuma pesquisa criada ainda</Text>
              <Text variant="body-md" className="text-gray-300 max-w-sm">
                Clique em <strong>+ Nova Pesquisa</strong> para criar um link e compartilhá-lo com os colaboradores.
              </Text>
            </div>
          </Card>
        ) : selectedSession ? (
          <div className="flex flex-col gap-6">
            {selectedGroup ? (
              <PairedSessionCard
                group={selectedGroup}
                tenantSlug={tenantSlug}
                selectedSession={selectedSession}
                canCreate={canCreate}
                canDelete={isGlobalAdmin}
                copied={copied}
                toggleActivePending={toggleActive.isPending}
                createEficaciaPending={createEficacia.isPending}
                onSelect={(s) => setSelectedSession((prev) => (prev?.id === s.id ? null : s))}
                onCopy={copyLink}
                onToggleActive={(s) => toggleActive.mutate(s)}
                onEdit={(s) => setEditTarget(s)}
                onDelete={(s) => setDeleteTarget(s)}
                onNavigate={(s) => navigate(ROUTES.treinamento(tenantSlug, s.slug))}
                onCreateEficacia={(slug) => createEficacia.mutate(slug)}
              />
            ) : (
              <SessionCard
                session={selectedSession}
                tenantSlug={tenantSlug}
                isSelected
                copied={copied}
                toggleActivePending={toggleActive.isPending}
                canDelete={isGlobalAdmin}
                onSelect={() => setSelectedSession(null)}
                onCopy={copyLink}
                onToggleActive={() => toggleActive.mutate(selectedSession)}
                onEdit={() => setEditTarget(selectedSession)}
                onDelete={() => setDeleteTarget(selectedSession)}
                onNavigate={() => navigate(ROUTES.treinamento(tenantSlug, selectedSession.slug))}
              />
            )}

            {sessionMetrics && (
              <div
                className={`grid gap-4 ${
                  selectedSession.trainingType === "reacao"
                    ? "grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-2 lg:grid-cols-3"
                }`}
              >
                <MetricCard title="Total de Respostas" value={sessionMetrics.totalResponses} />
                <MetricCard
                  title="Média Satisfação"
                  value={`${sessionMetrics.averageSatisfaction}`}
                  subtitle="Escala do formulário"
                />
                {selectedSession.trainingType === "reacao" && (
                  <MetricCard
                    title="Recomendariam"
                    value={`${sessionMetrics.averageNps}%`}
                    subtitle="Avaliações de Reação"
                  />
                )}
                <MetricCard
                  title="Respostas Este Mês"
                  value={sessionMetrics.responsesThisMonth}
                  subtitle={`${sessionMetrics.responsesLastMonth} no mês anterior`}
                />
              </div>
            )}

            <ResponsesPanel
              tenantSlug={tenantSlug}
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <PairedSessionCard
                key={group.reacao.id}
                group={group}
                tenantSlug={tenantSlug}
                selectedSession={selectedSession}
                canCreate={canCreate}
                canDelete={isGlobalAdmin}
                copied={copied}
                toggleActivePending={toggleActive.isPending}
                createEficaciaPending={createEficacia.isPending}
                onSelect={handleSessionClick}
                onCopy={copyLink}
                onToggleActive={(s) => toggleActive.mutate(s)}
                onEdit={(s) => setEditTarget(s)}
                onDelete={(s) => setDeleteTarget(s)}
                onNavigate={(s) => navigate(ROUTES.treinamento(tenantSlug, s.slug))}
                onCreateEficacia={(slug) => createEficacia.mutate(slug)}
              />
            ))}

            {standalone.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                tenantSlug={tenantSlug}
                isSelected={false}
                copied={copied}
                toggleActivePending={toggleActive.isPending}
                canDelete={isGlobalAdmin}
                onSelect={() => handleSessionClick(session)}
                onCopy={copyLink}
                onToggleActive={() => toggleActive.mutate(session)}
                onEdit={() => setEditTarget(session)}
                onDelete={() => setDeleteTarget(session)}
                onNavigate={() => navigate(ROUTES.treinamento(tenantSlug, session.slug))}
              />
            ))}

            <Text variant="caption" className="text-gray-300 text-center mt-2">
              Clique em uma pesquisa para ver as respostas
            </Text>
          </div>
        )}
      </div>

      {showCreate && (
        <SessionForm
          tenantSlug={tenantSlug}
          onClose={() => setShowCreate(false)}
          onSaved={() => setShowCreate(false)}
        />
      )}
      {editTarget && (
        <SessionForm
          tenantSlug={tenantSlug}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          session={deleteTarget}
          tenantSlug={tenantSlug}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
