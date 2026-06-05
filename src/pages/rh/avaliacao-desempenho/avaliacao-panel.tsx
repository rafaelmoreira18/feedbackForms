import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { PerformanceEvaluation, PerformanceEvaluationStatus, Pdi } from "@/types";
import { performanceEvaluationService } from "@/services/performance-evaluation-service";
import { pdiService } from "@/services/pdi-service";
import { generatePdiReport } from "@/services/pdi-report-service";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import { AvaliacaoReport } from "./avaliacao-report";

const PDI_STATUS_LABEL: Record<Pdi["status"], string> = {
  pendente: "Aguardando gestor",
  aguardando_colaborador: "Aguardando colaborador",
  concluida: "Concluído",
};

const STATUS_BADGE: Record<PerformanceEvaluationStatus, { label: string; cls: string }> = {
  pendente: { label: "Aguardando gestor", cls: "bg-yellow-base/10 text-yellow-600" },
  aguardando_colaborador: { label: "Aguardando colaborador", cls: "bg-blue-50 text-blue-600" },
  concluida: { label: "Concluída", cls: "bg-green-base/10 text-green-base" },
};

interface AvaliacaoPanelProps {
  tenantSlug: string;
  evaluation: PerformanceEvaluation;
  canManage: boolean;
  canDelete: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function AvaliacaoPanel({
  tenantSlug,
  evaluation,
  canManage,
  canDelete,
  onClose,
  onDeleted,
}: AvaliacaoPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const badge = STATUS_BADGE[evaluation.status];

  const copyLink = () => {
    const url = `${window.location.origin}${ROUTES.avaliacaoDesempenho(tenantSlug, evaluation.slug)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleActive = useMutation({
    mutationFn: () =>
      performanceEvaluationService.update(tenantSlug, evaluation.slug, {
        active: !evaluation.active,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations", tenantSlug] }),
  });

  const remove = useMutation({
    mutationFn: () => performanceEvaluationService.remove(tenantSlug, evaluation.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations", tenantSlug] });
      onDeleted();
    },
  });

  // PDI vinculado a esta avaliação (existe no máximo um por avaliação)
  const { data: pdis = [] } = useQuery({
    queryKey: ["pdis", tenantSlug],
    queryFn: () => pdiService.getAll(tenantSlug),
    enabled: !!tenantSlug && evaluation.status === "concluida",
  });
  const pdi = pdis.find((p) => p.evaluationId === evaluation.id) ?? null;

  const [pdiCopied, setPdiCopied] = useState(false);
  const copyPdiLink = (slug: string) => {
    const url = `${window.location.origin}${ROUTES.pdiDesenvolvimento(tenantSlug, slug)}`;
    navigator.clipboard.writeText(url).then(() => {
      setPdiCopied(true);
      setTimeout(() => setPdiCopied(false), 2000);
    });
  };

  const createPdi = useMutation({
    mutationFn: () => pdiService.create(tenantSlug, { evaluationSlug: evaluation.slug }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["pdis", tenantSlug] });
      copyPdiLink(created.slug);
      toast.success("PDI criado! Link copiado — encaminhe ao gestor.");
    },
    onError: () => toast.error("Não foi possível criar o PDI. Tente novamente."),
  });

  return (
    <div className="rounded-2xl border-2 border-teal-base shadow-lg bg-teal-base/5">
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Text variant="heading-sm" className="text-gray-400">
                {evaluation.colaboradorNome}
              </Text>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${badge.cls}`}>
                {badge.label}
              </span>
              {!evaluation.active && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-sans bg-gray-200 text-gray-400">
                  Inativo
                </span>
              )}
            </div>
            <Text variant="body-sm" className="text-gray-300">
              {[evaluation.cargo, evaluation.setor, evaluation.gestorArea]
                .filter(Boolean)
                .join(" · ")}
              {evaluation.dataAvaliacao ? ` · ${evaluation.dataAvaliacao}` : ""}
            </Text>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.avaliacaoDesempenho(tenantSlug, evaluation.slug))}
            >
              Abrir link
            </Button>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={toggleActive.isPending}
                onClick={() => toggleActive.mutate()}
              >
                {evaluation.active ? "Desativar" : "Ativar"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        {/* Corpo */}
        {evaluation.status === "concluida" ? (
          <div className="flex flex-col gap-4">
            {/* PDI — Plano de Desenvolvimento Individual */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Text variant="body-sm" className="font-semibold text-gray-400">
                    PDI — Plano de Desenvolvimento Individual
                  </Text>
                  {pdi && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-sans bg-teal-base/10 text-teal-dark">
                      {PDI_STATUS_LABEL[pdi.status]}
                    </span>
                  )}
                </div>

                {!pdi ? (
                  <Button
                    size="sm"
                    disabled={createPdi.isPending}
                    onClick={() => createPdi.mutate()}
                  >
                    {createPdi.isPending ? "Criando..." : "Criar PDI"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => copyPdiLink(pdi.slug)}>
                      {pdiCopied ? "Copiado!" : "Copiar link"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(ROUTES.pdiDesenvolvimento(tenantSlug, pdi.slug))}
                    >
                      Abrir link
                    </Button>
                    {pdi.status === "concluida" && (
                      <Button variant="secondary" size="sm" onClick={() => generatePdiReport(pdi)}>
                        Baixar PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-300">
                {!pdi
                  ? "Crie o PDI e encaminhe o link ao gestor. Ele preenche as ações e o feedback, depois repassa ao colaborador para validar."
                  : pdi.status === "pendente"
                  ? "Aguardando o gestor preencher o PDI. Compartilhe o link com o gestor."
                  : pdi.status === "aguardando_colaborador"
                  ? "Gestor já preencheu. Compartilhe o link com o colaborador para validar."
                  : "PDI concluído. Você pode baixar o PDF."}
              </p>
            </div>

            <AvaliacaoReport evaluation={evaluation} />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-400 flex flex-col gap-2">
            <p className="font-semibold">Avaliação em andamento</p>
            <ul className="text-gray-300 flex flex-col gap-1">
              <li>
                {evaluation.managerSubmittedAt ? "✅" : "⬜"} Avaliação do gestor
              </li>
              <li>
                {evaluation.selfSubmittedAt ? "✅" : "⬜"} Autoavaliação do colaborador
              </li>
            </ul>
            <p className="text-xs text-gray-300">
              {evaluation.status === "pendente"
                ? "Compartilhe o link com o gestor para iniciar. Depois ele repassa ao colaborador."
                : "O gestor já respondeu. Compartilhe o link com o colaborador para concluir."}
            </p>
          </div>
        )}

        {/* Exclusão */}
        {canDelete && (
          <div className="pt-1">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Text variant="body-sm" className="text-gray-400">
                  Excluir definitivamente?
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  {remove.isPending ? "Excluindo..." : "Confirmar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-base hover:underline"
              >
                Excluir avaliação
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
