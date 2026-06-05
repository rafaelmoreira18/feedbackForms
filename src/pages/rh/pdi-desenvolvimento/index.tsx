import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { pdiService } from "@/services/pdi-service";
import type { Pdi, PdiAction, PdiResponsabilidade } from "@/types";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import SectionHeader from "@/components/forms/section-header";
import { COMPETENCIES } from "../avaliacao-desempenho/competencies";
import { PdiReport } from "./pdi-report";

type Role = "gestor" | "colaborador";

const RESP_OPTIONS: { value: PdiResponsabilidade; label: string }[] = [
  { value: "colaborador", label: "Colaborador" },
  { value: "empresa", label: "Empresa" },
];

const COMP_OPTIONS = COMPETENCIES.map((c) => ({ value: c.id, label: c.label }));

// linha em branco para a tabela de ações
function emptyAction(): PdiAction {
  return { acao: "", responsabilidade: "colaborador", competenciaId: COMPETENCIES[0].id, prazo: "" };
}

// ─── Formulário do gestor (tabela de ações + feedback) ──────────────────────────

function ManagerForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (actions: PdiAction[], feedback: string) => void;
}) {
  const [actions, setActions] = useState<PdiAction[]>([emptyAction()]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const update = (i: number, patch: Partial<PdiAction>) =>
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const addRow = () => setActions((prev) => [...prev, emptyAction()]);
  const removeRow = (i: number) =>
    setActions((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = actions
      .map((a) => ({ ...a, acao: a.acao.trim() }))
      .filter((a) => a.acao.length > 0);
    if (cleaned.length === 0) {
      setError("Adicione pelo menos uma ação de desenvolvimento.");
      return;
    }
    if (cleaned.some((a) => !a.prazo)) {
      setError("Defina o prazo de todas as ações preenchidas.");
      return;
    }
    setError("");
    onSubmit(cleaned, feedback.trim());
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-6">
      <p className="text-sm text-gray-300 font-sans">
        Defina as ações de desenvolvimento do colaborador. Para cada ação, informe quem é
        responsável, a competência vinculada e o prazo de conclusão.
      </p>

      <div className="flex flex-col gap-5">
        {actions.map((a, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 p-4 flex flex-col gap-3 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
                Ação {i + 1}
              </span>
              {actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-xs text-red-base hover:underline"
                >
                  Remover
                </button>
              )}
            </div>

            <Textarea
              placeholder="Ex.: Curso de liderança; leitura do livro X; reunião de acompanhamento mensal"
              value={a.acao}
              onChange={(e) => update(i, { acao: e.target.value })}
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Responsável"
                options={RESP_OPTIONS}
                value={a.responsabilidade}
                onChange={(e) =>
                  update(i, { responsabilidade: e.target.value as PdiResponsabilidade })
                }
              />
              <Select
                label="Competência"
                options={COMP_OPTIONS}
                value={a.competenciaId}
                onChange={(e) => update(i, { competenciaId: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">
                  Prazo
                </label>
                <input
                  type="date"
                  min={todayIso}
                  value={a.prazo}
                  onChange={(e) => update(i, { prazo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-sans text-gray-400 text-base bg-white/80 outline-none focus:border-teal-base focus:ring-4 focus:ring-teal-base/10 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="self-start text-sm font-semibold text-teal-base hover:underline"
      >
        + Adicionar ação
      </button>

      <Textarea
        label="Feedback final do gestor"
        placeholder="Espaço para fortalecer os pontos fortes e os pontos a melhorar do colaborador."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={4}
      />

      {error && <p className="text-sm text-red-base font-sans">{error}</p>}

      <Button
        type="submit"
        size="lg"
        className="w-full text-base font-bold tracking-wide"
        disabled={submitting}
      >
        {submitting ? "Enviando..." : "Enviar PDI →"}
      </Button>
    </form>
  );
}

// ─── Formulário do colaborador (validação) ──────────────────────────────────────

function ColaboradorForm({
  pdi,
  submitting,
  onSubmit,
}: {
  pdi: Pdi;
  submitting: boolean;
  onSubmit: (nome: string, comentario: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    setError("");
    onSubmit(nome.trim(), comentario.trim());
  };

  return (
    <div className="p-5 sm:p-8 flex flex-col gap-6">
      <p className="text-sm text-gray-300 font-sans">
        Revise o plano de desenvolvimento elaborado pelo seu gestor. Ao final, confirme
        sua ciência informando seu nome completo. O comentário é opcional.
      </p>

      <PdiReport pdi={pdi} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-gray-100 pt-5">
        <Input
          label="Seu nome completo *"
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Textarea
          label="Comentário (opcional)"
          placeholder="Se quiser, deixe um comentário sobre o seu PDI."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={4}
        />

        {error && <p className="text-sm text-red-base font-sans">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full text-base font-bold tracking-wide"
          disabled={submitting}
        >
          {submitting ? "Enviando..." : "Validar PDI →"}
        </Button>
      </form>
    </div>
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

// Copia a URL do PDI para a área de transferência (com feedback via toast).
function copyPdiLink() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => toast.success("Link copiado!"))
    .catch(() => toast.error("Não foi possível copiar o link"));
}

// ─── Main ─────────────────────────────────────────────────────────────────────────

export default function PdiDesenvolvimentoPublica() {
  const { tenantSlug = "", slug = "" } = useParams<{ tenantSlug: string; slug: string }>();
  const [pdi, setPdi] = useState<Pdi | null>(null);
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
    pdiService
      .getOne(tenantSlug, slug)
      .then(setPdi)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tenantSlug, slug]);

  const role: Role | null =
    pdi?.status === "pendente"
      ? "gestor"
      : pdi?.status === "aguardando_colaborador"
      ? "colaborador"
      : null;

  const handleManagerSubmit = async (actions: PdiAction[], feedback: string) => {
    setSubmitting(true);
    try {
      const updated = await pdiService.submitManager(tenantSlug, slug, actions, feedback);
      setPdi(updated);
      setJustSubmitted(true);
    } catch {
      toast.error("Não foi possível enviar o PDI. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleColaboradorSubmit = async (nome: string, comentario: string) => {
    setSubmitting(true);
    try {
      const updated = await pdiService.submitColaborador(tenantSlug, slug, nome, comentario);
      setPdi(updated);
      setJustSubmitted(true);
    } catch {
      toast.error("Não foi possível validar o PDI. Tente novamente.");
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

  if (notFound || !pdi) {
    return (
      <CenteredCard
        icon="🔍"
        title="PDI não encontrado"
        message="Este link pode ter expirado ou sido desativado."
      />
    );
  }

  if (!pdi.active) {
    return (
      <CenteredCard
        icon="🔒"
        title="Link inativo"
        message="Este PDI foi encerrado. Obrigado!"
      />
    );
  }

  // Acabou de enviar a etapa do gestor → orienta a compartilhar com o colaborador
  if (justSubmitted && pdi.status === "aguardando_colaborador") {
    return (
      <CenteredCard
        icon="✅"
        title="PDI registrado!"
        message="Agora compartilhe este mesmo link com o colaborador para que ele valide o PDI."
      >
        <Button className="w-full" onClick={copyPdiLink}>
          Copiar link do colaborador
        </Button>
      </CenteredCard>
    );
  }

  // Acabou de validar (colaborador) → confirmação
  if (justSubmitted && pdi.status === "concluida") {
    return (
      <CenteredCard
        icon="🎉"
        title="PDI validado!"
        message="Obrigado! Seu PDI foi concluído com sucesso."
      />
    );
  }

  const header = (
    <div className="text-center mb-6 px-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">
        PDI — Plano de Desenvolvimento Individual
      </h1>
      <p className="text-gray-300 font-sans mt-1 text-sm sm:text-base font-semibold">
        {pdi.colaboradorNome}
      </p>
      <p className="text-gray-300 font-sans text-xs mt-0.5">
        {[pdi.cargo, pdi.setor].filter(Boolean).join(" · ")}
        {pdi.dataAvaliacao ? ` · ${pdi.dataAvaliacao}` : ""}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {header}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

          {pdi.status === "concluida" ? (
            <div className="p-5 sm:p-8">
              <SectionHeader icon="📋" title="Plano de Desenvolvimento Individual" />
              <div className="mt-5">
                <PdiReport pdi={pdi} />
              </div>
            </div>
          ) : role === "gestor" ? (
            <>
              <div className="px-5 sm:px-8 pt-5">
                <SectionHeader icon="👔" title="Elaboração do PDI" subtitle="Etapa 1 de 2 — Gestor" />
              </div>
              <ManagerForm submitting={submitting} onSubmit={handleManagerSubmit} />
            </>
          ) : (
            <>
              <div className="px-5 sm:px-8 pt-5">
                <SectionHeader icon="🙋" title="Validação do Colaborador" subtitle="Etapa 2 de 2" />
              </div>
              <ColaboradorForm pdi={pdi} submitting={submitting} onSubmit={handleColaboradorSubmit} />
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
