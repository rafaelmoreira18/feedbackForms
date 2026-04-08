import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { trainingService, type TrainingResponse } from "@/services/training-service";
import { tenantService } from "@/services/tenant-service";
import type { TrainingSession, TrainingType, CreateTrainingSessionDto } from "@/types";
import { ROUTES } from "@/routes";
import { Link } from "react-router-dom";
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

// ─── Single response row ──────────────────────────────────────────────────────

function avgScore(answers: { questionId: string; value: number }[], count: number): number {
  const scores = answers
    .filter((a) => a.questionId !== "nps" && a.value > 0)
    .slice(0, count)
    .map((a) => a.value);
  if (scores.length === 0) return 0;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function avgColor(avg: number, max: number) {
  const pct = avg / max;
  if (pct >= 0.75) return "bg-green-base/10 text-green-base border border-green-base/30";
  if (pct >= 0.5) return "bg-yellow-50 text-yellow-600 border border-yellow-300";
  return "bg-red-base/10 text-red-base border border-red-base/30";
}

function npsColor(v: number) {
  if (v >= 9) return "bg-green-base/10 text-green-base border border-green-base/30";
  if (v >= 7) return "bg-yellow-50 text-yellow-600 border border-yellow-300";
  return "bg-red-base/10 text-red-base border border-red-base/30";
}

function ResponseRow({
  response,
  trainingType,
}: {
  response: TrainingResponse;
  trainingType: TrainingType;
}) {
  const [expanded, setExpanded] = useState(false);

  const questions = trainingType === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
  const labels = trainingType === "eficacia" ? EFICACIA_LABELS : REACAO_LABELS;
  const colors = trainingType === "eficacia" ? EFICACIA_COLORS : REACAO_COLORS;
  const scaleMax = trainingType === "eficacia" ? 3 : 5;

  const answerMap = new Map(response.answers.map((a) => [a.questionId, a.value]));
  const nps = answerMap.get("nps");
  const avg = avgScore(response.answers, questions.length);

  return (
    <div
      className={`rounded-xl border cursor-pointer transition-all duration-150 ${
        expanded ? "border-teal-base/50 shadow-md" : "border-gray-100 hover:border-teal-base/30 shadow-sm"
      } bg-white`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        {/* Name */}
        <Text variant="body-sm-bold" className="text-gray-400 flex-1 min-w-30">
          {response.respondentName || "Anônimo"}
        </Text>

        {/* Avg rate */}
        {avg > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${avgColor(avg, scaleMax)}`}>
            Média {avg.toFixed(1)}/{scaleMax}
          </span>
        )}

        {/* NPS (reação only) */}
        {trainingType === "reacao" && nps != null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${npsColor(nps)}`}>
            Nota {nps}/10
          </span>
        )}

        {/* Recomenda (reação only) */}
        {trainingType === "reacao" && response.recomenda != null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
              response.recomenda
                ? "bg-green-base/10 text-green-base border-green-base/30"
                : "bg-red-base/10 text-red-base border-red-base/30"
            }`}
          >
            {response.recomenda ? "Recomenda" : "Não recomenda"}
          </span>
        )}

        {/* Date */}
        <Text variant="caption" className="text-gray-300 shrink-0 ml-auto">
          {new Date(response.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })}
        </Text>

        {/* Chevron */}
        <span className={`text-gray-300 text-xs transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {questions.map((q, i) => {
            const qid = `q${i + 1}`;
            const val = answerMap.get(qid);
            return (
              <div key={qid} className="flex items-start gap-3">
                <span className="text-xs text-gray-300 shrink-0 w-4 text-right mt-0.5">{i + 1}.</span>
                <p className="text-xs text-gray-300 flex-1">{q}</p>
                {val != null && val > 0 ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${colors[val] ?? ""}`}>
                    {labels[val] ?? val}
                  </span>
                ) : (
                  <span className="text-xs text-gray-200 shrink-0">—</span>
                )}
              </div>
            );
          })}

          {trainingType === "reacao" && nps != null && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-300 shrink-0 w-4 text-right">★</span>
              <p className="text-xs text-gray-300 flex-1">Nota geral (0–10)</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${npsColor(nps)}`}>{nps}</span>
            </div>
          )}

          {/* Qualitative fields */}
          {(response.pontoAlto || response.jaAplica || response.recomenda != null || response.recomendaMotivo || response.comments) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 mt-1">
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
              {response.recomenda != null && response.recomendaMotivo && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">Motivo:</p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.recomendaMotivo}</p>
                </div>
              )}
              {response.comments && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">
                    {trainingType === "eficacia" ? "Observações:" : "Comentários:"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.comments}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Question analytics ───────────────────────────────────────────────────────

function questionAvgColor(avg: number, max: number) {
  const pct = avg / max;
  if (pct >= 0.75) return { barColor: "#52a350", badge: "bg-green-base/10 text-green-base border border-green-base/30" };
  if (pct >= 0.5)  return { barColor: "#facc15", badge: "bg-yellow-50 text-yellow-600 border border-yellow-300" };
  return { barColor: "#e74c3c", badge: "bg-red-base/10 text-red-base border border-red-base/30" };
}

function QuestionAnalytics({
  responses,
  trainingType,
}: {
  responses: TrainingResponse[];
  trainingType: TrainingType;
}) {
  const questions = trainingType === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
  const scaleMax = trainingType === "eficacia" ? 3 : 5;

  const questionStats = questions.map((text, i) => {
    const qid = `q${i + 1}`;
    const values = responses
      .map((r) => r.answers.find((a) => a.questionId === qid)?.value)
      .filter((v): v is number => v != null && v > 0);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    return { qid, text, avg, count: values.length };
  }).filter((q) => q.count > 0).sort((a, b) => a.avg - b.avg);

  if (questionStats.length === 0) return null;

  return (
    <Card shadow="sm" className="flex flex-col gap-4">
      <div>
        <Text variant="body-sm-bold" className="text-gray-400">Análise por Pergunta</Text>
        <Text variant="caption" className="text-gray-300">
          Ordenado da nota mais baixa para mais alta · escala 1–{scaleMax}
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        {questionStats.map((q) => {
          const { barColor, badge } = questionAvgColor(q.avg, scaleMax);
          const pct = (q.avg / scaleMax) * 100;
          return (
            <div key={q.qid} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-gray-300 flex-1 leading-relaxed">{q.text}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 border ${badge}`}>
                  {q.avg.toFixed(1)}/{scaleMax}
                </span>
              </div>
              <div className="relative w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#e5e7eb" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
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

  const allResponses = data?.data ?? [];
  const responses = allResponses;

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
          <QuestionAnalytics responses={allResponses} trainingType={session.trainingType} />
          <Text variant="caption" className="text-gray-300">
            {responses.length} {responses.length === 1 ? "resposta" : "respostas"}
          </Text>
          {responses.map((r) => (
            <ResponseRow key={r.id} response={r} trainingType={session.trainingType} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Session grouping helpers ─────────────────────────────────────────────────

interface SessionGroup {
  reacao: TrainingSession;
  eficacia: TrainingSession | null;
}

/** Adds `days` to an ISO date string without timezone issues */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const result = new Date(y, m - 1, d + days);
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
}

/**
 * Returns alert info for a reação session.
 * - overdue:  today >= trainingDate + 30 days (eficácia not created)
 * - warning:  today >= trainingDate + 23 days (7 days left)
 * - none:     no alert needed
 * Also returns daysLeft (positive = days until target, negative = days overdue).
 */
function getEficaciaAlertInfo(
  reacaoDate: string,
  eficacia: TrainingSession | null,
): { status: "none" | "warning" | "overdue"; daysLeft: number } {
  if (eficacia) return { status: "none", daysLeft: 0 };
  const [y, m, d] = reacaoDate.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(y, m - 1, d + 30);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft <= 0) return { status: "overdue", daysLeft };
  if (daysLeft <= 7) return { status: "warning", daysLeft };
  return { status: "none", daysLeft };
}

/**
 * Splits a flat session list into:
 * - `groups`: every reação session paired with its linked eficácia (or null)
 * - `standalone`: eficácia sessions without linkedSessionId (legacy, shown individually)
 */
function groupSessions(sessions: TrainingSession[]): {
  groups: SessionGroup[];
  standalone: TrainingSession[];
} {
  const eficaciaByLinked = new Map<string, TrainingSession>();
  sessions.forEach((s) => {
    if (s.trainingType === "eficacia" && s.linkedSessionId) {
      eficaciaByLinked.set(s.linkedSessionId, s);
    }
  });

  const groups: SessionGroup[] = sessions
    .filter((s) => s.trainingType === "reacao")
    .map((reacao) => ({ reacao, eficacia: eficaciaByLinked.get(reacao.id) ?? null }));

  const standalone = sessions.filter(
    (s) => s.trainingType === "eficacia" && !s.linkedSessionId,
  );

  return { groups, standalone };
}

// ─── Paired session card ──────────────────────────────────────────────────────

interface PairedSessionCardProps {
  group: SessionGroup;
  tenantSlug: string;
  selectedSession: TrainingSession | null;
  canCreate: boolean;
  canDelete: boolean;
  copied: string | null;
  toggleActivePending: boolean;
  createEficaciaPending: boolean;
  onSelect: (session: TrainingSession) => void;
  onCopy: (slug: string) => void;
  onToggleActive: (session: TrainingSession) => void;
  onEdit: (session: TrainingSession) => void;
  onDelete: (session: TrainingSession) => void;
  onNavigate: (session: TrainingSession) => void;
  onCreateEficacia: (reacaoSlug: string) => void;
}

function PairedSessionCard({
  group,
  tenantSlug: _tenantSlug,
  selectedSession,
  canCreate,
  canDelete,
  copied,
  toggleActivePending,
  createEficaciaPending,
  onSelect,
  onCopy,
  onToggleActive,
  onEdit,
  onDelete,
  onNavigate,
  onCreateEficacia,
}: PairedSessionCardProps) {
  const { reacao, eficacia } = group;
  const { status: alertStatus, daysLeft } = getEficaciaAlertInfo(reacao.trainingDate, eficacia);

  // Outer card: never highlighted — selection state lives only in the sub-cards
  const outerBorder = "border-transparent hover:border-teal-base/20 bg-white shadow-sm";

  return (
    <div className={`rounded-2xl border-2 transition-all duration-150 ${outerBorder}`}>
      {/* Card header */}
      <div className="px-4 pt-4 pb-2">
        <Text variant="heading-sm" className="text-gray-400">
          {reacao.title}
        </Text>
        <Text variant="body-sm" className="text-gray-300">
          {reacao.instructor}
        </Text>
      </div>

      {/* Sub-cards */}
      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ── Reação sub-card ── */}
        <div
          className={`rounded-xl border p-3 cursor-pointer transition-all ${
            selectedSession?.id === reacao.id
              ? "border-teal-base bg-teal-base/5"
              : "border-gray-100 hover:border-teal-base/30 bg-gray-50"
          }`}
          onClick={() => onSelect(reacao)}
        >
          {/* Header row: badges + alert icon */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              Reação
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                reacao.active ? "bg-green-base/10 text-green-base" : "bg-gray-200 text-gray-300"
              }`}
            >
              {reacao.active ? "Ativo" : "Inativo"}
            </span>

            {/* Discrete alert badge on the reação card */}
            {alertStatus === "overdue" && (
              <span
                title={`Eficácia não criada — prazo vencido há ${Math.abs(daysLeft)} dia(s)`}
                className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" style={{ fill: "#dc2626" }}>
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
                </svg>
                Criar eficácia
              </span>
            )}
            {alertStatus === "warning" && (
              <span
                title={`Faltam ${daysLeft} dia(s) para criar a avaliação de eficácia`}
                className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" style={{ fill: "#f97316" }}>
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
                </svg>
                {daysLeft}d restantes
              </span>
            )}
          </div>

          <Text variant="body-sm" className="text-gray-300 mb-3">
            {reacao.trainingDate}
          </Text>

          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => onNavigate(reacao)}>
              Visualizar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCopy(reacao.slug)}>
              {copied === reacao.slug ? "Copiado!" : "Copiar Link"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleActive(reacao)}
              disabled={toggleActivePending}
            >
              {reacao.active ? "Desativar" : "Ativar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(reacao)}>
              Editar
            </Button>
            {canDelete && (
              <Button size="sm" variant="secondary" onClick={() => onDelete(reacao)}>
                Excluir
              </Button>
            )}
          </div>
        </div>

        {/* ── Eficácia sub-card ── */}
        {eficacia ? (
          <div
            className={`rounded-xl border p-3 cursor-pointer transition-all ${
              selectedSession?.id === eficacia.id
                ? "border-teal-base bg-teal-base/5"
                : "border-gray-100 hover:border-teal-base/30 bg-gray-50"
            }`}
            onClick={() => onSelect(eficacia)}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                Eficácia
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  eficacia.active ? "bg-green-base/10 text-green-base" : "bg-gray-200 text-gray-300"
                }`}
              >
                {eficacia.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <Text variant="body-sm" className="text-gray-300 mb-3">
              {eficacia.trainingDate}
            </Text>
            <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" onClick={() => onNavigate(eficacia)}>
                Visualizar
              </Button>
              <Button size="sm" variant="outline" onClick={() => onCopy(eficacia.slug)}>
                {copied === eficacia.slug ? "Copiado!" : "Copiar Link"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleActive(eficacia)}
                disabled={toggleActivePending}
              >
                {eficacia.active ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(eficacia)}>
                Editar
              </Button>
              {canDelete && (
                <Button size="sm" variant="secondary" onClick={() => onDelete(eficacia)}>
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* ── Placeholder: eficácia not yet created ── */
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              Eficácia
            </span>
            <Text variant="body-sm" className="text-gray-300">
              Não criado
            </Text>
            <Text variant="caption" className="text-gray-300">
              Data alvo: {addDays(reacao.trainingDate, 30)}
            </Text>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => onCreateEficacia(reacao.slug)}
                disabled={createEficaciaPending}
              >
                {createEficaciaPending ? "Criando..." : "+ Criar Eficácia"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Treinamentos() {
  const { tenantSlug: slugFromUrl = "" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isGlobalAdmin = user?.role === "holding_admin" || user?.role === "rh_admin";

  // Global rh_admin: no slug in URL — show tenant selector
  const isGlobal = !slugFromUrl;
  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = isGlobal ? selectedSlug : slugFromUrl;

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
    queryFn: () =>
      trainingService.getMetrics(tenantSlug, { session: selectedSession!.slug }),
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

  // When a session inside a group is selected, find the full group to display it
  const selectedGroup = useMemo(() => {
    if (!selectedSession) return null;
    return (
      groups.find(
        (g) =>
          g.reacao.id === selectedSession.id || g.eficacia?.id === selectedSession.id,
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
          {!user?.tenantId && (
            <Link to={ROUTES.rhUsuarios}>
              <Button variant="outline" size="sm">
                Usuários RH
              </Button>
            </Link>
          )}
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
          /* ── Selected session: show the paired card (or standalone) + responses ── */
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

            {/* Metrics for selected session */}
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

            {/* Legacy standalone eficácia sessions */}
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
  canDelete: boolean;
  onSelect: () => void;
  onCopy: (slug: string) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}

function SessionCard({
  session,
  tenantSlug: _tenantSlug,
  isSelected,
  copied,
  toggleActivePending,
  canDelete,
  onSelect,
  onCopy,
  onToggleActive,
  onEdit,
  onDelete,
  onNavigate,
}: SessionCardProps) {
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
          {canDelete && (
            <Button size="sm" variant="secondary" onClick={onDelete}>
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
