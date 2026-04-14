import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { trainingService } from "@/services/training-service";
import type { TrainingSession } from "@/types";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import SectionHeader from "@/components/forms/section-header";

// ─── Question definitions ──────────────────────────────────────────────────────

const NOTO_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";

// Eficácia: 3-point scale (1-Ruim, 2-Bom, 3-Ótimo)
const EFICACIA_QUESTIONS = [
  "Na prática, demonstrou/demonstraram ter adquirido novas técnicas e métodos aplicáveis ao trabalho?",
  "Apresentou/apresentaram ideias para a realização das tarefas?",
  "Desenvolveu/desenvolveram maior qualidade no trabalho, devido ao uso dos conteúdos aprendidos?",
  "Observou-se o aumento da produtividade do trabalho desenvolvido?",
  "Aplica/aplicaram satisfatoriamente regras de trabalho introduzidas?",
  "Demonstra/demonstraram iniciativa na solução de problemas relativos às questões treinadas?",
  "Compartilha/compartilham o conhecimento e habilidade adquirido entre a equipe de trabalho?",
];

const EFICACIA_LABELS: Record<number, string> = { 1: "Ruim", 2: "Bom", 3: "Ótimo" };
const EFICACIA_EMOJIS: Record<number, string> = {
  1: `${NOTO_BASE}/1f614/512.webp`,
  2: `${NOTO_BASE}/1f642/512.webp`,
  3: `${NOTO_BASE}/1f601/512.webp`,
};
const EFICACIA_ACTIVE: Record<number, string> = {
  1: "bg-red-base border-red-base text-white shadow-md",
  2: "bg-teal-base border-teal-base text-white shadow-md",
  3: "bg-green-base border-green-base text-white shadow-md",
};
const EFICACIA_INACTIVE: Record<number, string> = {
  1: "bg-white border-red-base/30 text-red-base/70 hover:border-red-base hover:text-red-base",
  2: "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base",
  3: "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base",
};

// Reação: 5-point scale
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

// 1=Muito Insatisfeito 2=Insatisfeito 3=Neutro 4=Satisfeito 5=Muito Satisfeito
// Emoji mapping: 1→😢 2→😞(rating4 r1 sad) 3→😐(neutral) 4→🙂(r3 slightly) 5→😁(r4 big smile)
const REACAO_LABELS: Record<number, string> = {
  1: "Muito Insatisfeito",
  2: "Insatisfeito",
  3: "Neutro",
  4: "Satisfeito",
  5: "Muito Satisfeito",
};
const REACAO_EMOJIS: Record<number, string> = {
  1: `${NOTO_BASE}/1f622/512.webp`,   // 😢 crying
  2: `${NOTO_BASE}/1f614/512.webp`,   // 😔 pensive (sad from rating4 r1)
  3: `${NOTO_BASE}/1f610/512.webp`,   // 😐 neutral
  4: `${NOTO_BASE}/1f642/512.webp`,   // 🙂 slightly smiling (rating4 r3)
  5: `${NOTO_BASE}/1f601/512.webp`,   // 😁 grin (rating4 r4)
};
const REACAO_ACTIVE: Record<number, string> = {
  1: "bg-red-base border-red-base text-white shadow-md",
  2: "bg-orange-400 border-orange-400 text-white shadow-md",
  3: "bg-yellow-base border-yellow-base text-white shadow-md",
  4: "bg-teal-base border-teal-base text-white shadow-md",
  5: "bg-green-base border-green-base text-white shadow-md",
};
const REACAO_INACTIVE: Record<number, string> = {
  1: "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base",
  2: "bg-white border-gray-200 text-gray-300 hover:border-orange-400 hover:text-orange-400",
  3: "bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base",
  4: "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base",
  5: "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base",
};

const ANIM = `
@keyframes popIn {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.emoji-pop { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
`;

// ─── Scale button component ────────────────────────────────────────────────────

interface ScaleButtonProps {
  value: number;
  selected: number;
  label: string;
  emojiUrl: string;
  activeStyle: string;
  inactiveStyle: string;
  onClick: (v: number) => void;
}

function ScaleButton({ value, selected, label, emojiUrl, activeStyle, inactiveStyle, onClick }: ScaleButtonProps) {
  const isActive = selected === value;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onClick(isActive ? 0 : value)}
      className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 font-semibold text-xs transition-all duration-150 flex-1 min-w-0 ${isActive ? activeStyle : inactiveStyle}`}
    >
      {isActive && (
        <img key={`${value}-active`} src={emojiUrl} alt={label} width={20} height={20} className="emoji-pop shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Eficácia form ─────────────────────────────────────────────────────────────

interface EficaciaFormProps {
  onSubmit: (answers: { questionId: string; value: number }[], obs: string) => void;
  submitting: boolean;
}

function EficaciaForm({ onSubmit, submitting }: EficaciaFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [obs, setObs] = useState("");

  const setAnswer = (qid: string, v: number) =>
    setAnswers((prev) => ({ ...prev, [qid]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const arr = EFICACIA_QUESTIONS.map((_, i) => ({
      questionId: `q${i + 1}`,
      value: answers[`q${i + 1}`] ?? 0,
    }));
    onSubmit(arr, obs);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <SectionHeader icon="📋" title="Avaliação de Desempenho Pós-Treinamento" />
        <p className="text-sm text-gray-300 font-sans -mt-2">
          Escala: <strong>1 – Ruim</strong> · <strong>2 – Bom</strong> · <strong>3 – Ótimo</strong>
        </p>
        {EFICACIA_QUESTIONS.map((q, i) => {
          const qid = `q${i + 1}`;
          const val = answers[qid] ?? 0;
          return (
            <div key={qid} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-400 font-sans">
                {i + 1}. {q}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map((r) => (
                  <ScaleButton
                    key={r}
                    value={r}
                    selected={val}
                    label={EFICACIA_LABELS[r]}
                    emojiUrl={EFICACIA_EMOJIS[r]}
                    activeStyle={EFICACIA_ACTIVE[r]}
                    inactiveStyle={EFICACIA_INACTIVE[r]}
                    onClick={(v) => setAnswer(qid, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon="📝" title="Observações" subtitle="Opcional" />
        <Textarea
          placeholder="Comentários adicionais sobre o desempenho..."
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
      </section>

      <Button type="submit" size="lg" className="w-full text-base font-bold tracking-wide" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar Avaliação →"}
      </Button>
    </form>
  );
}

// ─── Reação form ───────────────────────────────────────────────────────────────

interface ReacaoFormProps {
  onSubmit: (
    answers: { questionId: string; value: number }[],
    extras: { pontoAlto: string; jaAplica: string; recomenda: boolean | null; recomendaMotivo: string; comments: string },
  ) => void;
  submitting: boolean;
}

function ReacaoForm({ onSubmit, submitting }: ReacaoFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [nps, setNps] = useState<number | null>(null); // 0-10 numeric score
  const [pontoAlto, setPontoAlto] = useState("");
  const [jaAplica, setJaAplica] = useState("");
  const [recomenda, setRecomenda] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");

  const setAnswer = (qid: string, v: number) =>
    setAnswers((prev) => ({ ...prev, [qid]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pontoAlto.trim() || !jaAplica.trim() || recomenda === null) return;
    const arr: { questionId: string; value: number }[] = REACAO_QUESTIONS.map((_, i) => ({
      questionId: `q${i + 1}`,
      value: answers[`q${i + 1}`] ?? 0,
    }));
    if (nps !== null) arr.push({ questionId: "nps", value: nps });
    onSubmit(arr, { pontoAlto, jaAplica, recomenda, recomendaMotivo: "", comments });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-8">
      {/* Rating questions */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon="📋" title="Parte 1 — Avaliação Quantitativa" />
        <p className="text-sm text-gray-300 font-sans -mt-2">
          1 – Muito Insatisfeito · 2 – Insatisfeito · 3 – Neutro · 4 – Satisfeito · 5 – Muito Satisfeito
        </p>
        {REACAO_QUESTIONS.map((q, i) => {
          const qid = `q${i + 1}`;
          const val = answers[qid] ?? 0;
          return (
            <div key={qid} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-400 font-sans">{q}</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((r) => (
                  <ScaleButton
                    key={r}
                    value={r}
                    selected={val}
                    label={REACAO_LABELS[r]}
                    emojiUrl={REACAO_EMOJIS[r]}
                    activeStyle={REACAO_ACTIVE[r]}
                    inactiveStyle={REACAO_INACTIVE[r]}
                    onClick={(v) => setAnswer(qid, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* NPS 0-10 numeric score */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-400 font-sans">
            De 0 a 10, qual seria sua nota geral?
          </p>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setNps(nps === n ? null : n)}
                className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all duration-150 ${
                  nps === n
                    ? n <= 6
                      ? "bg-red-base border-red-base text-white"
                      : n <= 8
                      ? "bg-yellow-base border-yellow-base text-white"
                      : "bg-green-base border-green-base text-white"
                    : "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Qualitative */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon="✍️" title="Parte 2 — Avaliação Qualitativa" subtitle="Obrigatório" />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-gray-400 font-sans">
            1. Qual foi o ponto alto (mais positivo) do treinamento? <span className="text-red-base">*</span>
          </p>
          <Textarea
            placeholder="Descreva o ponto mais positivo..."
            value={pontoAlto}
            onChange={(e) => setPontoAlto(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-gray-400 font-sans">
            2. O que você já consegue aplicar a partir de hoje? <span className="text-red-base">*</span>
          </p>
          <Textarea
            placeholder="Descreva o que pode ser aplicado imediatamente..."
            value={jaAplica}
            onChange={(e) => setJaAplica(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-400 font-sans">
            3. Você recomendaria esse treinamento para colegas? <span className="text-red-base">*</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setRecomenda(recomenda === true ? null : true)}
              className={`flex-1 h-12 rounded-xl font-bold text-base transition-all duration-150 border-2 ${
                recomenda === true
                  ? "bg-green-base border-green-base text-white"
                  : "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base"
              }`}
            >
              ✓ Sim
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setRecomenda(recomenda === false ? null : false)}
              className={`flex-1 h-12 rounded-xl font-bold text-base transition-all duration-150 border-2 ${
                recomenda === false
                  ? "bg-red-base border-red-base text-white"
                  : "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base"
              }`}
            >
              ✗ Não
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon="💬" title="Comentários, Sugestões ou Elogios" subtitle="Opcional" />
        <Textarea
          placeholder="Deixe aqui qualquer comentário, sugestão ou elogio..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        <p className="text-xs text-gray-300 font-sans text-center">
          Obrigada por contribuir com a nossa evolução! — Gestão de Talentos e Terceiros
        </p>
      </section>

      <Button type="submit" size="lg" className="w-full text-base font-bold tracking-wide" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar Avaliação →"}
      </Button>
    </form>
  );
}

// ─── Submitted screen ──────────────────────────────────────────────────────────

function SubmittedScreen({ onNew }: { onNew: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="text-center flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-green-base border-4 border-green-base flex items-center justify-center">
          <span className="text-4xl text-white">✓</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-400 font-sans">Enviado!</h2>
          <p className="text-gray-300 font-sans mt-2">Avaliação registrada com sucesso.</p>
          <p className="text-gray-300 font-sans text-sm mt-1">
            Obrigada por contribuir com a nossa evolução!
          </p>
        </div>
        <Button variant="outline" onClick={onNew}>
          Nova avaliação
        </Button>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function TrainingSurvey() {
  const { tenantSlug = "", sessionSlug = "" } = useParams<{
    tenantSlug: string;
    sessionSlug: string;
  }>();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!tenantSlug || !sessionSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    trainingService
      .getSession(tenantSlug, sessionSlug)
      .then(setSession)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tenantSlug, sessionSlug]);

  const handleConfirmName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondentName.trim()) {
      setNameError("Por favor, informe seu nome.");
      return;
    }
    setNameError("");
    setNameConfirmed(true);
  };

  const handleEficaciaSubmit = async (
    answers: { questionId: string; value: number }[],
    obs: string,
  ) => {
    setSubmitting(true);
    try {
      await trainingService.submitResponse(tenantSlug, {
        sessionSlug,
        respondentName: respondentName.trim(),
        answers,
        comments: obs,
      });
      setSubmitted(true);
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReacaoSubmit = async (
    answers: { questionId: string; value: number }[],
    extras: { pontoAlto: string; jaAplica: string; recomenda: boolean | null; recomendaMotivo: string; comments: string },
  ) => {
    setSubmitting(true);
    try {
      await trainingService.submitResponse(tenantSlug, {
        sessionSlug,
        respondentName: respondentName.trim(),
        answers,
        pointoAlto: extras.pontoAlto,
        jaAplica: extras.jaAplica,
        recomenda: extras.recomenda ?? undefined,
        recomendaMotivo: extras.recomendaMotivo,
        comments: extras.comments,
      });
      setSubmitted(true);
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setNameConfirmed(false);
    setRespondentName("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">
            Treinamento não encontrado
          </h2>
          <p className="text-gray-300 font-sans text-sm">
            Este link pode ter expirado ou sido desativado.
          </p>
        </div>
      </div>
    );
  }

  if (!session.active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">
            Link inativo
          </h2>
          <p className="text-gray-300 font-sans text-sm">
            Esta pesquisa foi encerrada. Obrigado!
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <SubmittedScreen onNew={resetForm} />;
  }

  const typeLabel =
    session.trainingType === "eficacia"
      ? "Avaliação de Eficácia de Treinamento"
      : "Avaliação de Reação — Treinamento";

  return (
    <>
      <style>{ANIM}</style>
      <div className="min-h-screen py-6 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 px-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">{typeLabel}</h1>
            <p className="text-gray-300 font-sans mt-1 text-sm sm:text-base font-semibold">
              {session.title}
            </p>
            <p className="text-gray-300 font-sans text-xs mt-0.5">
              {session.trainingDate} · {session.instructor}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

            {/* Step 1: Name */}
            {!nameConfirmed ? (
              <form onSubmit={handleConfirmName} className="p-5 sm:p-8 flex flex-col gap-6">
                <SectionHeader icon="👤" title="Identificação" subtitle="Opcional" />
                <Input
                  label="Seu nome"
                  type="text"
                  placeholder="Digite seu nome (ou deixe em branco para anônimo)"
                  value={respondentName}
                  onChange={(e) => { setRespondentName(e.target.value); setNameError(""); }}
                />
                {nameError && (
                  <p className="text-sm text-red-base font-sans">{nameError}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  onClick={() => { if (!respondentName.trim()) setRespondentName("Anônimo"); }}
                >
                  Iniciar Avaliação →
                </Button>
              </form>
            ) : session.trainingType === "eficacia" ? (
              <EficaciaForm onSubmit={handleEficaciaSubmit} submitting={submitting} />
            ) : (
              <ReacaoForm onSubmit={handleReacaoSubmit} submitting={submitting} />
            )}
          </div>

          <p className="text-center text-xs text-gray-300 font-sans mt-4 pb-2">
            Gestão de Talentos e Terceiros
          </p>
        </div>
      </div>
    </>
  );
}
