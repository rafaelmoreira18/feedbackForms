import type { Pdi, PdiResponsabilidade } from "@/types";
import { competencyById } from "../avaliacao-desempenho/competencies";

const RESP_LABEL: Record<PdiResponsabilidade, string> = {
  colaborador: "Colaborador",
  empresa: "Empresa",
};

function formatDateBr(iso: string | null): string {
  if (!iso) return "—";
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Visão do PDI concluído (ou já preenchido pelo gestor): tabela de ações,
 * feedback do gestor e, quando houver, a validação do colaborador.
 * Usado tanto na página pública quanto no painel de RH.
 */
export function PdiReport({ pdi }: { pdi: Pdi }) {
  const actions = pdi.actions ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Tabela de ações */}
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-2">
          Ações de Desenvolvimento
        </p>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-400">
            <span>Ação</span>
            <span className="w-24 text-center">Responsável</span>
            <span className="w-32 text-center">Competência</span>
            <span className="w-20 text-center">Prazo</span>
          </div>
          {actions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-300">
              Nenhuma ação registrada.
            </div>
          ) : (
            actions.map((a, i) => (
              <div key={i} className="border-t border-gray-100 px-3 py-2">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                  <span className="text-sm text-gray-500">{a.acao}</span>
                  <span className="w-24 text-center text-xs text-gray-400">
                    {RESP_LABEL[a.responsabilidade] ?? a.responsabilidade}
                  </span>
                  <span className="w-32 text-center text-xs text-gray-400">
                    {competencyById(a.competenciaId)?.label ?? a.competenciaId}
                  </span>
                  <span className="w-20 text-center text-xs text-gray-400">
                    {formatDateBr(a.prazo)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback do gestor */}
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-1">
          Feedback Final do Gestor
        </p>
        <p className="text-sm text-gray-500 whitespace-pre-wrap rounded-xl border border-gray-100 bg-white p-3">
          {pdi.managerFeedback?.trim() || "—"}
        </p>
      </div>

      {/* Validação do colaborador */}
      {pdi.status === "concluida" && (
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-1">
            Validação do Colaborador
          </p>
          <div className="rounded-xl border border-gray-100 bg-white p-3 flex flex-col gap-1">
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Nome:</span>{" "}
              {pdi.colaboradorNomeValidacao ?? "—"}
            </p>
            <p className="text-xs text-gray-300">
              Validado em {formatDateBr(pdi.colaboradorSubmittedAt)}
            </p>
            {pdi.colaboradorComentario?.trim() && (
              <p className="text-sm text-gray-500 italic mt-1 whitespace-pre-wrap">
                "{pdi.colaboradorComentario}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
