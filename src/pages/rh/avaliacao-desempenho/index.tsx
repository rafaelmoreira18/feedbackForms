import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { performanceEvaluationService } from "@/services/performance-evaluation-service";
import type { PerformanceEvaluation, PerformanceAnswer } from "@/types";
import Button from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import SectionHeader from "@/components/forms/section-header";
import { COMPETENCIES, COMPETENCIES_BY_GROUP } from "./competencies";
import { AvaliacaoReport } from "./avaliacao-report";

type Role = "gestor" | "colaborador";

// ─── Escala 0–10 ────────────────────────────────────────────────────────────────

function ScoreScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <button
          key={n}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all duration-150 ${
            value === n
              ? n <= 4
                ? "bg-red-base border-red-base text-white"
                : n <= 7
                ? "bg-yellow-base border-yellow-base text-white"
                : "bg-green-base border-green-base text-white"
              : "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Questionário (gestor ou colaborador) ───────────────────────────────────────

function CompetencyQuestionnaire({
  role,
  submitting,
  onSubmit,
}: {
  role: Role;
  submitting: boolean;
  onSubmit: (answers: PerformanceAnswer[]) => void;
}) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const setNota = (id: string, v: number) => setNotas((p) => ({ ...p, [id]: v }));
  const setJust = (id: string, v: string) => setJustificativas((p) => ({ ...p, [id]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const faltando = COMPETENCIES.filter((c) => notas[c.id] === undefined);
    if (faltando.length > 0) {
      setError(`Preencha a nota de todas as competências (faltam ${faltando.length}).`);
      return;
    }
    setError("");
    const answers: PerformanceAnswer[] = COMPETENCIES.map((c) => ({
      competenciaId: c.id,
      valor: notas[c.id],
      justificativa: (justificativas[c.id] ?? "").trim(),
    }));
    onSubmit(answers);
  };

  const intro =
    role === "gestor"
      ? "Avalie cada competência de 0 a 10. Não deixe nenhuma nota em branco."
      : "Faça sua autoavaliação: atribua uma nota de 0 a 10 para cada competência.";

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-8">
      <p className="text-sm text-gray-300 font-sans">{intro}</p>

      {COMPETENCIES_BY_GROUP.map(({ grupo, items }) => (
        <section key={grupo} className="flex flex-col gap-5">
          <SectionHeader icon="📋" title={grupo} />
          {items.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-400 font-sans">
                {c.label} <span className="text-red-base">*</span>
              </p>
              <p className="text-xs text-gray-300 font-sans -mt-1">{c.descricao}</p>
              <ScoreScale value={notas[c.id] ?? null} onChange={(v) => setNota(c.id, v)} />
              <Textarea
                placeholder="Justifique (opcional)"
                value={justificativas[c.id] ?? ""}
                onChange={(e) => setJust(c.id, e.target.value)}
              />
            </div>
          ))}
        </section>
      ))}

      {error && <p className="text-sm text-red-base font-sans">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base font-bold tracking-wide" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar Avaliação →"}
      </Button>
    </form>
  );
}

// ─── Telas auxiliares ────────────────────────────────────────────────────────────

function CenteredCard({
  icon,
  title,
  message,
  children,
}: {
  icon: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">{title}</h2>
        <p className="text-gray-300 font-sans text-sm">{message}</p>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

// Copia a URL da avaliação para a área de transferência (com feedback via toast).
function copyEvaluationLink() {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Link copiado!"))
    .catch(() => toast.error("Não foi possível copiar o link"));
}

// ─── Main ─────────────────────────────────────────────────────────────────────────

export default function AvaliacaoDesempenhoPublica() {
  const { tenantSlug = "", slug = "" } = useParams<{ tenantSlug: string; slug: string }>();
  const [evaluation, setEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!tenantSlug || !slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    performanceEvaluationService
      .getOne(tenantSlug, slug)
      .then(setEvaluation)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tenantSlug, slug]);

  const role: Role | null =
    evaluation?.status === "pendente"
      ? "gestor"
      : evaluation?.status === "aguardando_colaborador"
      ? "colaborador"
      : null;

  const handleSubmit = async (answers: PerformanceAnswer[]) => {
    if (!role) return;
    setSubmitting(true);
    try {
      const updated =
        role === "gestor"
          ? await performanceEvaluationService.submitManager(tenantSlug, slug, answers)
          : await performanceEvaluationService.submitSelf(tenantSlug, slug, answers);
      setEvaluation(updated);
      setJustSubmitted(true);
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !evaluation) {
    return (
      <CenteredCard
        icon="🔍"
        title="Avaliação não encontrada"
        message="Este link pode ter expirado ou sido desativado."
      />
    );
  }

  if (!evaluation.active) {
    return (
      <CenteredCard
        icon="🔒"
        title="Link inativo"
        message="Esta avaliação foi encerrada. Obrigado!"
      />
    );
  }

  // Acabou de enviar a etapa do gestor → orienta a compartilhar com o colaborador
  if (justSubmitted && evaluation.status === "aguardando_colaborador") {
    return (
      <CenteredCard
        icon="✅"
        title="Avaliação do gestor registrada!"
        message="Agora compartilhe este mesmo link com o colaborador para que ele faça a autoavaliação."
      >
        <Button className="w-full" onClick={copyEvaluationLink}>
          Copiar link do colaborador
        </Button>
      </CenteredCard>
    );
  }

  const header = (
    <div className="text-center mb-6 px-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">
        Avaliação de Desempenho
      </h1>
      <p className="text-gray-300 font-sans mt-1 text-sm sm:text-base font-semibold">
        {evaluation.colaboradorNome}
      </p>
      <p className="text-gray-300 font-sans text-xs mt-0.5">
        {[evaluation.cargo, evaluation.setor].filter(Boolean).join(" · ")}
        {evaluation.dataAvaliacao ? ` · ${evaluation.dataAvaliacao}` : ""}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {header}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

          {evaluation.status === "concluida" ? (
            <div className="p-5 sm:p-8">
              <SectionHeader icon="📊" title="Relatório de Desempenho" />
              <div className="mt-5">
                <AvaliacaoReport evaluation={evaluation} />
              </div>
            </div>
          ) : role === "gestor" ? (
            <>
              <div className="px-5 sm:px-8 pt-5">
                <SectionHeader
                  icon="👔"
                  title="Avaliação do Gestor"
                  subtitle="Etapa 1 de 2"
                />
              </div>
              <CompetencyQuestionnaire role="gestor" submitting={submitting} onSubmit={handleSubmit} />
            </>
          ) : (
            <>
              <div className="px-5 sm:px-8 pt-5">
                <SectionHeader
                  icon="🙋"
                  title="Autoavaliação do Colaborador"
                  subtitle="Etapa 2 de 2"
                />
              </div>
              <CompetencyQuestionnaire role="colaborador" submitting={submitting} onSubmit={handleSubmit} />
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 font-sans mt-4 pb-2">
          Gestão de Talentos e Terceiros
        </p>
      </div>
    </div>
  );
}
