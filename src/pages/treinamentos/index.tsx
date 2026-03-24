import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { trainingService, type TrainingResponse } from "@/services/training-service";
import { tenantService } from "@/services/tenant-service";
import type { TrainingSession, TrainingType, CreateTrainingSessionDto } from "@/types";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import MetricCard from "@/components/ui/metric-card";

// ─── Question definitions (mirrors treinamento/index.tsx) ──────────────────────

const EFICACIA_QUESTIONS = [
  "Na prática, demonstrou/demonstraram ter adquirido novas técnicas e métodos aplicáveis ao trabalho?",
  "Apresentou/apresentaram ideias para a realização das tarefas?",
  "Desenvolveu/desenvolveram maior qualidade no trabalho, devido ao uso dos conteúdos aprendidos?",
  "Observou-se o aumento da produtividade do trabalho desenvolvido?",
  "Aplica/aplicaram satisfatoriamente regras de trabalho introduzidas?",
  "Demonstra/demonstraram iniciativa na solução de problemas relativos às questões treinadas?",
  "Compartilha/compartilham o conhecimento e habilidade adquirido entre a equipe de trabalho?",
];

const REACAO_QUESTIONS = [
  "Clareza e objetividade do conteúdo",
  "Aplicabilidade do conteúdo na prática",
  "Qualidade dos materiais utilizados",
  "Domínio e didática do(a) facilitador(a)",
  "Tempo destinado ao treinamento",
  "Participação e engajamento",
  "Ambiente e estrutura física",
  "Qualidade dos equipamentos",
  "Organização geral do treinamento",
  "Satisfação geral com o treinamento",
];

const EFICACIA_LABELS: Record<number, string> = { 1: "Ruim", 2: "Bom", 3: "Ótimo" };
const REACAO_LABELS: Record<number, string> = {
  1: "Muito Insatisfeito",
  2: "Insatisfeito",
  3: "Neutro",
  4: "Satisfeito",
  5: "Muito Satisfeito",
};

const EFICACIA_COLORS: Record<number, string> = {
  1: "bg-red-base/10 text-red-base border border-red-base/30",
  2: "bg-teal-base/10 text-teal-base border border-teal-base/30",
  3: "bg-green-base/10 text-green-base border border-green-base/30",
};
const REACAO_COLORS: Record<number, string> = {
  1: "bg-red-base/10 text-red-base border border-red-base/30",
  2: "bg-orange-100 text-orange-500 border border-orange-300",
  3: "bg-yellow-50 text-yellow-600 border border-yellow-300",
  4: "bg-teal-base/10 text-teal-base border border-teal-base/30",
  5: "bg-green-base/10 text-green-base border border-green-base/30",
};

const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  eficacia: "Avaliação de Eficácia de Treinamento",
  reacao: "Avaliação de Reação — Treinamento",
};

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface SessionFormProps {
  tenantSlug: string;
  initial?: TrainingSession;
  onClose: () => void;
  onSaved: () => void;
}

function SessionForm({ tenantSlug, initial, onClose, onSaved }: SessionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trainingDate, setTrainingDate] = useState(initial?.trainingDate ?? "");
  const [trainingType, setTrainingType] = useState<TrainingType>(initial?.trainingType ?? "reacao");
  const [instructor, setInstructor] = useState(initial?.instructor ?? "");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (dto: CreateTrainingSessionDto) =>
      trainingService.createSession(tenantSlug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao criar treinamento. Tente novamente."),
  });

  const update = useMutation({
    mutationFn: (dto: Partial<CreateTrainingSessionDto>) =>
      trainingService.updateSession(tenantSlug, initial!.slug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao atualizar treinamento."),
  });

  const isPending = create.isPending || update.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trainingDate || !instructor.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setError("");
    const dto = { title: title.trim(), trainingDate, trainingType, instructor: instructor.trim() };
    if (initial) update.mutate(dto);
    else create.mutate(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <Text as="h2" variant="heading-sm" className="text-gray-400">
          {initial ? "Editar Treinamento" : "Nova Pesquisa de Treinamento"}
        </Text>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Título do Treinamento *"
            type="text"
            placeholder="Ex: Integração Novos Colaboradores"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Tipo de Avaliação *"
            value={trainingType}
            options={[
              { value: "reacao", label: TRAINING_TYPE_LABELS.reacao },
              { value: "eficacia", label: TRAINING_TYPE_LABELS.eficacia },
            ]}
            onChange={(e) => setTrainingType(e.target.value as TrainingType)}
          />

          <DateInput
            label="Data do Treinamento *"
            value={trainingDate}
            onChange={setTrainingDate}
          />

          <Input
            label="Facilitador / Instrutor *"
            type="text"
            placeholder="Nome do instrutor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            required
          />

          {error && (
            <Text variant="body-sm" className="text-red-base">
              {error}
            </Text>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : initial ? "Salvar" : "Criar Link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmDelete({
  session,
  tenantSlug,
  onClose,
}: {
  session: TrainingSession;
  tenantSlug: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: () => trainingService.deleteSession(tenantSlug, session.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <Text as="h2" variant="heading-sm" className="text-gray-400">
          Excluir Treinamento?
        </Text>
        <Text variant="body-md" className="text-gray-300">
          O treinamento <strong className="text-gray-400">{session.title}</strong> e todas as suas
          respostas serão permanentemente excluídos.
        </Text>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={del.isPending}
            onClick={() => del.mutate()}
          >
            {del.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Single response card ─────────────────────────────────────────────────────

function ResponseCard({
  response,
  trainingType,
}: {
  response: TrainingResponse;
  trainingType: TrainingType;
}) {
  const questions =
    trainingType === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
  const labels = trainingType === "eficacia" ? EFICACIA_LABELS : REACAO_LABELS;
  const colors = trainingType === "eficacia" ? EFICACIA_COLORS : REACAO_COLORS;

  const answerMap = new Map(response.answers.map((a) => [a.questionId, a.value]));
  const npsValue = answerMap.get("nps");

  const npsColor =
    npsValue == null
      ? ""
      : npsValue <= 6
      ? "bg-red-base/10 text-red-base border border-red-base/30"
      : npsValue <= 8
      ? "bg-yellow-50 text-yellow-600 border border-yellow-300"
      : "bg-green-base/10 text-green-base border border-green-base/30";

  return (
    <Card shadow="sm" className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <Text variant="body-sm-bold" className="text-gray-400">
          {response.respondentName || "Anônimo"}
        </Text>
        <Text variant="caption" className="text-gray-300">
          {new Date(response.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>

      {/* Quantitative answers */}
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => {
          const qid = `q${i + 1}`;
          const val = answerMap.get(qid);
          return (
            <div key={qid} className="flex items-start gap-3">
              <span className="text-xs text-gray-300 shrink-0 mt-0.5 w-4 text-right">{i + 1}.</span>
              <p className="text-xs text-gray-300 flex-1">{q}</p>
              {val != null && val > 0 ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${colors[val] ?? ""}`}
                >
                  {labels[val] ?? val}
                </span>
              ) : (
                <span className="text-xs text-gray-200 shrink-0">—</span>
              )}
            </div>
          );
        })}

        {/* NPS row (reação only) */}
        {trainingType === "reacao" && npsValue != null && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300 shrink-0 mt-0.5 w-4 text-right">★</span>
            <p className="text-xs text-gray-300 flex-1">Nota geral (0–10)</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${npsColor}`}>
              {npsValue}
            </span>
          </div>
        )}
      </div>

      {/* Qualitative fields (reação only) */}
      {trainingType === "reacao" && (
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          {response.pontoAlto && (
            <div>
              <p className="text-xs font-semibold text-gray-300">Ponto alto:</p>
              <p className="text-xs text-gray-400 mt-0.5">{response.pontoAlto}</p>
            </div>
          )}
          {response.jaAplica && (
            <div>
              <p className="text-xs font-semibold text-gray-300">Já aplica:</p>
              <p className="text-xs text-gray-400 mt-0.5">{response.jaAplica}</p>
            </div>
          )}
          {response.recomenda != null && (
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-gray-300">Recomendaria:</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  response.recomenda
                    ? "bg-green-base/10 text-green-base border border-green-base/30"
                    : "bg-red-base/10 text-red-base border border-red-base/30"
                }`}
              >
                {response.recomenda ? "Sim" : "Não"}
              </span>
              {response.recomendaMotivo && (
                <span className="text-xs text-gray-300">— {response.recomendaMotivo}</span>
              )}
            </div>
          )}
          {response.comments && (
            <div>
              <p className="text-xs font-semibold text-gray-300">Comentários:</p>
              <p className="text-xs text-gray-400 mt-0.5">{response.comments}</p>
            </div>
          )}
        </div>
      )}

      {/* Eficácia comments */}
      {trainingType === "eficacia" && response.comments && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-300">Observações:</p>
          <p className="text-xs text-gray-400 mt-0.5">{response.comments}</p>
        </div>
      )}
    </Card>
  );
}

// ─── Responses panel ──────────────────────────────────────────────────────────

function ResponsesPanel({
  tenantSlug,
  session,
  onClose,
}: {
  tenantSlug: string;
  session: TrainingSession;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["training-responses", tenantSlug, session.slug],
    queryFn: () => trainingService.getResponses(tenantSlug, { session: session.slug }),
  });

  const responses = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <Text variant="heading-sm" className="text-gray-400">
            Respostas — {session.title}
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            {TRAINING_TYPE_LABELS[session.trainingType]} · {session.trainingDate} ·{" "}
            {session.instructor}
          </Text>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          ✕ Fechar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
        </div>
      ) : responses.length === 0 ? (
        <Card shadow="sm">
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <span className="text-4xl">📭</span>
            <Text variant="body-md" className="text-gray-300">
              Nenhuma resposta registrada para este treinamento ainda.
            </Text>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <Text variant="caption" className="text-gray-300">
            {responses.length} {responses.length === 1 ? "resposta" : "respostas"}
          </Text>
          {responses.map((r) => (
            <ResponseCard key={r.id} response={r} trainingType={session.trainingType} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Treinamentos() {
  const { tenantSlug: slugFromUrl = "" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Global rh_admin: no slug in URL — show tenant selector
  const isGlobal = !slugFromUrl;
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl;

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<TrainingSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingSession | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantService.getAll,
    enabled: isGlobal,
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["training-sessions", tenantSlug],
    queryFn: () => trainingService.getSessions(tenantSlug),
    enabled: !!tenantSlug,
  });

  const { data: metrics } = useQuery({
    queryKey: ["training-metrics", tenantSlug],
    queryFn: () => trainingService.getMetrics(tenantSlug),
    enabled: !!tenantSlug,
  });

  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: (session: TrainingSession) =>
      trainingService.updateSession(tenantSlug, session.slug, { active: !session.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] }),
  });

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
      {/* Page header */}
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
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tenant selector — global rh_admin only */}
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

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Total de Respostas" value={metrics.totalResponses} />
            <MetricCard
              title="Média Satisfação"
              value={`${metrics.averageSatisfaction}`}
              subtitle="Escala do formulário"
            />
            <MetricCard
              title="Recomendariam"
              value={`${metrics.averageNps}%`}
              subtitle="Avaliações de Reação"
            />
            <MetricCard
              title="Respostas Este Mês"
              value={metrics.responsesThisMonth}
              subtitle={`${metrics.responsesLastMonth} no mês anterior`}
            />
          </div>
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
              <Text variant="heading-sm" className="text-gray-300">
                Nenhuma pesquisa criada ainda
              </Text>
              <Text variant="body-md" className="text-gray-300 max-w-sm">
                Clique em <strong>+ Nova Pesquisa</strong> para criar um link e compartilhá-lo com os
                colaboradores.
              </Text>
            </div>
          </Card>
        ) : selectedSession ? (
          /* ── Selected session: show only that card + responses panel ── */
          <div className="flex flex-col gap-6">
            {/* The selected session card (highlighted) */}
            <SessionCard
              session={selectedSession}
              tenantSlug={tenantSlug}
              isSelected
              copied={copied}
              toggleActivePending={toggleActive.isPending}
              onSelect={() => setSelectedSession(null)}
              onCopy={copyLink}
              onToggleActive={() => toggleActive.mutate(selectedSession)}
              onEdit={() => setEditTarget(selectedSession)}
              onDelete={() => setDeleteTarget(selectedSession)}
              onNavigate={() => navigate(ROUTES.treinamento(tenantSlug, selectedSession.slug))}
            />

            {/* Responses panel */}
            <ResponsesPanel
              tenantSlug={tenantSlug}
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          </div>
        ) : (
          /* ── All sessions list ── */
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                tenantSlug={tenantSlug}
                isSelected={false}
                copied={copied}
                toggleActivePending={toggleActive.isPending}
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

      {/* Modals */}
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

// ─── Session card (extracted to avoid duplication) ────────────────────────────

interface SessionCardProps {
  session: TrainingSession;
  tenantSlug: string;
  isSelected: boolean;
  copied: string | null;
  toggleActivePending: boolean;
  onSelect: () => void;
  onCopy: (slug: string) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}

function SessionCard({
  session,
  tenantSlug,
  isSelected,
  copied,
  toggleActivePending,
  onSelect,
  onCopy,
  onToggleActive,
  onEdit,
  onDelete,
  onNavigate,
}: SessionCardProps) {
  const surveyUrl = `${window.location.origin}/${tenantSlug}/treinamento/${session.slug}`;

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
        isSelected
          ? "border-teal-base shadow-lg bg-teal-base/5"
          : "border-transparent hover:border-teal-base/40 bg-white shadow-sm"
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Info */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Text variant="heading-sm" className="text-gray-400">
              {session.title}
            </Text>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${
                session.active
                  ? "bg-green-base/10 text-green-base"
                  : "bg-gray-200 text-gray-300"
              }`}
            >
              {session.active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <Text variant="body-sm" className="text-gray-300">
            {TRAINING_TYPE_LABELS[session.trainingType]} · {session.instructor} ·{" "}
            {session.trainingDate}
          </Text>
          <p className="text-xs text-gray-300 font-mono break-all mt-0.5">{surveyUrl}</p>
        </div>

        {/* Actions — stop propagation so clicks don't toggle selection */}
        <div
          className="flex flex-wrap gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="outline" onClick={onNavigate}>
            Visualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCopy(session.slug)}>
            {copied === session.slug ? "Copiado!" : "Copiar Link"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleActive}
            disabled={toggleActivePending}
          >
            {session.active ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="secondary" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}
