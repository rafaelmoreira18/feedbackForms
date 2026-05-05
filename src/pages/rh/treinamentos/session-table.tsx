import type { TrainingSession } from "@/types";
import { TRAINING_TYPE_LABELS } from "./session-constants";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";

// ─── Session grouping helpers ─────────────────────────────────────────────────

export interface SessionGroup {
  reacao: TrainingSession;
  eficacia: TrainingSession | null;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const result = new Date(y, m - 1, d + days);
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
}

export function getEficaciaAlertInfo(
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

export function groupSessions(sessions: TrainingSession[]): {
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

export function PairedSessionCard({
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

  const outerBorder = "border-transparent hover:border-teal-base/20 bg-white shadow-sm";

  return (
    <div className={`rounded-2xl border-2 transition-all duration-150 ${outerBorder}`}>
      <div className="px-4 pt-4 pb-2">
        <Text variant="heading-sm" className="text-gray-400">
          {reacao.title}
        </Text>
        <Text variant="body-sm" className="text-gray-300">
          {reacao.instructor}
        </Text>
      </div>

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
            <Button size="sm" variant="outline" onClick={() => onNavigate(reacao)}>Visualizar</Button>
            <Button size="sm" variant="outline" onClick={() => onCopy(reacao.slug)}>
              {copied === reacao.slug ? "Copiado!" : "Copiar Link"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onToggleActive(reacao)} disabled={toggleActivePending}>
              {reacao.active ? "Desativar" : "Ativar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(reacao)}>Editar</Button>
            {canDelete && (
              <Button size="sm" variant="secondary" onClick={() => onDelete(reacao)}>Excluir</Button>
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
              <Button size="sm" variant="outline" onClick={() => onNavigate(eficacia)}>Visualizar</Button>
              <Button size="sm" variant="outline" onClick={() => onCopy(eficacia.slug)}>
                {copied === eficacia.slug ? "Copiado!" : "Copiar Link"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onToggleActive(eficacia)} disabled={toggleActivePending}>
                {eficacia.active ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(eficacia)}>Editar</Button>
              {canDelete && (
                <Button size="sm" variant="secondary" onClick={() => onDelete(eficacia)}>Excluir</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              Eficácia
            </span>
            <Text variant="body-sm" className="text-gray-300">Não criado</Text>
            <Text variant="caption" className="text-gray-300">
              Data alvo: {addDays(reacao.trainingDate, 30)}
            </Text>
            {canCreate && (
              <Button size="sm" onClick={() => onCreateEficacia(reacao.slug)} disabled={createEficaciaPending}>
                {createEficaciaPending ? "Criando..." : "+ Criar Eficácia"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session card (standalone eficácia legado) ────────────────────────────────

export interface SessionCardProps {
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

export function SessionCard({
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
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Text variant="heading-sm" className="text-gray-400">
              {session.title}
            </Text>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${
                session.active ? "bg-green-base/10 text-green-base" : "bg-gray-200 text-gray-300"
              }`}
            >
              {session.active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <Text variant="body-sm" className="text-gray-300">
            {TRAINING_TYPE_LABELS[session.trainingType]} · {session.instructor} · {session.trainingDate}
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={onNavigate}>Visualizar</Button>
          <Button size="sm" variant="outline" onClick={() => onCopy(session.slug)}>
            {copied === session.slug ? "Copiado!" : "Copiar Link"}
          </Button>
          <Button size="sm" variant="outline" onClick={onToggleActive} disabled={toggleActivePending}>
            {session.active ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
          {canDelete && (
            <Button size="sm" variant="secondary" onClick={onDelete}>Excluir</Button>
          )}
        </div>
      </div>
    </div>
  );
}
