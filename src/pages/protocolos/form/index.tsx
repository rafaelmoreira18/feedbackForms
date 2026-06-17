import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { protocoloService } from "@/services/protocolo-service";
import type {
  SubmitTriagemPayload,
  SubmitEcgPayload,
  SubmitInvestigacaoPayload,
  SubmitDesfechoPayload,
  RascunhoBloco,
  EncerrarPayload,
} from "@/services/protocolo-service";
import { ROUTES } from "@/routes";
import type { RegistroAcao } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Stethoscope, Ban, Pencil, History } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { StageBadge } from "../index";
import { STAGE_META, ORDER, BLOCOS, BLOCO_TITULO, labelCampo, labelValor, type BlocoKey } from "../constants";
import { extractApiError, fmtDataHora } from "../utils";
import BlocoTriagemForm from "./bloco-triagem";
import BlocoEcgForm from "./bloco-ecg";
import BlocoInvestigacaoForm from "./bloco-investigacao";
import BlocoDesfechoForm from "./bloco-desfecho";

/** Componente de formulário por bloco — evita a cadeia de ifs em renderBlock. */
const BLOCO_FORM = {
  triagem: BlocoTriagemForm,
  ecg: BlocoEcgForm,
  investigacao: BlocoInvestigacaoForm,
  desfecho: BlocoDesfechoForm,
} as const;

/** Props comuns aos 4 formulários de bloco (o `initial` varia por bloco). */
type BlocoFormCommonProps = {
  initial: unknown;
  readOnly: boolean;
  submitLabel?: string;
  submitting: boolean;
  onSubmit: (p: Record<string, unknown>) => void;
  responsavel: { nome: string; registro: string };
  rascunho?: unknown;
  onDraftChange?: (d: Record<string, unknown>) => void;
  draftOnly?: boolean;
};

export default function ProtocoloForm() {
  const { tenantSlug = "", slug = "" } = useParams<{ tenantSlug: string; slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [gateOpen, setGateOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [encerrarOpen, setEncerrarOpen] = useState(false);
  const [openBlocos, setOpenBlocos] = useState<BlocoKey[]>([]);
  // Etapas concluídas que o usuário abriu para EDITAR.
  const [editBlocos, setEditBlocos] = useState<BlocoKey[]>([]);
  const toggleBloco = (b: BlocoKey) =>
    setOpenBlocos((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));
  const toggleEdit = (b: BlocoKey) =>
    setEditBlocos((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));

  const { data: protocolo, isLoading } = useQuery({
    queryKey: ["protocolo", tenantSlug, slug],
    queryFn: () => protocoloService.getOne(tenantSlug, slug),
    enabled: !!tenantSlug && !!slug,
  });

  // Salva rascunhos pendentes antes de sair (definido adiante via ref).
  const flushRef = useRef<() => void>(() => {});

  const backToList = () => {
    flushRef.current();
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    navigate(ROUTES.protocolos(tenantSlug));
  };

  const onStageDone = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    toast.success(msg);
    setEditando(false);
    backToList();
  };

  const mTriagem = useMutation({
    mutationFn: (p: SubmitTriagemPayload) => protocoloService.submitTriagem(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Triagem fechada."),
    onError: (e) => toast.error(extractApiError(e, "Erro ao fechar a etapa.")),
  });
  const mEcg = useMutation({
    mutationFn: (p: SubmitEcgPayload) => protocoloService.submitEcg(tenantSlug, slug, p),
    onSuccess: () => onStageDone("ECG fechado."),
    onError: (e) => toast.error(extractApiError(e, "Erro ao fechar a etapa.")),
  });
  const mInvestigacao = useMutation({
    mutationFn: (p: SubmitInvestigacaoPayload) => protocoloService.submitInvestigacao(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Investigação fechada."),
    onError: (e) => toast.error(extractApiError(e, "Erro ao fechar a etapa.")),
  });
  const mDesfecho = useMutation({
    mutationFn: (p: SubmitDesfechoPayload) => protocoloService.submitDesfecho(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Protocolo concluído."),
    onError: (e) => toast.error(extractApiError(e, "Erro ao concluir o protocolo.")),
  });
  const mEncerrar = useMutation({
    mutationFn: (p: EncerrarPayload) => protocoloService.encerrar(tenantSlug, slug, p),
    onSuccess: () => { setEncerrarOpen(false); onStageDone("Protocolo encerrado."); },
    onError: (e) => toast.error(extractApiError(e, "Erro ao encerrar o protocolo.")),
  });

  // Edição de etapa já concluída — não muda de etapa, só registra a alteração.
  const mEditar = useMutation({
    mutationFn: ({ bloco, dados }: { bloco: BlocoKey; dados: Record<string, unknown> & { responsavelNome: string; registroProfissional: string } }) =>
      protocoloService.editarBloco(tenantSlug, slug, bloco, dados),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
      setEditBlocos((prev) => prev.filter((k) => k !== vars.bloco));
      toast.success("Alterações salvas.");
    },
    onError: (e) => toast.error(extractApiError(e, "Erro ao salvar alterações.")),
  });

  // Auto-save de rascunho (debounce) — guarda timers e o último valor por bloco,
  // para poder "descarregar" (flush) o que ainda não foi salvo ao sair da página.
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingDrafts = useRef<Partial<Record<RascunhoBloco, Record<string, unknown>>>>({});
  const saveDraft = useCallback(
    (bloco: RascunhoBloco, dados: Record<string, unknown>) => {
      pendingDrafts.current[bloco] = dados;
      clearTimeout(draftTimers.current[bloco]);
      draftTimers.current[bloco] = setTimeout(() => {
        const d = pendingDrafts.current[bloco];
        if (!d) return;
        delete pendingDrafts.current[bloco];
        protocoloService.saveRascunho(tenantSlug, slug, bloco, d).catch(() => {});
      }, 800);
    },
    [tenantSlug, slug],
  );

  // Salva imediatamente todos os rascunhos pendentes — evita perder os últimos
  // campos digitados antes do debounce ao voltar para a lista ou desmontar a tela.
  const flushDrafts = useCallback(() => {
    (Object.keys(pendingDrafts.current) as RascunhoBloco[]).forEach((bloco) => {
      const d = pendingDrafts.current[bloco];
      clearTimeout(draftTimers.current[bloco]);
      if (d) protocoloService.saveRascunho(tenantSlug, slug, bloco, d).catch(() => {});
    });
    pendingDrafts.current = {};
  }, [tenantSlug, slug]);
  // Mantém a ref de flush sempre atualizada (sem acessar ref durante o render).
  useEffect(() => {
    flushRef.current = flushDrafts;
  }, [flushDrafts]);
  // Flush ao desmontar (navegar para fora por qualquer caminho).
  useEffect(() => () => flushRef.current(), []);

  // Histórico ordenado do mais recente ao mais antigo (memoizado).
  const historicoOrdenado = useMemo(
    () => [...(protocolo?.historicoAcoes ?? [])].sort((a, b) => b.em.localeCompare(a.em)),
    [protocolo?.historicoAcoes],
  );

  if (isLoading || !protocolo) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentIndex = ORDER[protocolo.currentStage];
  const concluido = protocolo.currentStage === "concluido";
  const activeKey = concluido ? null : (protocolo.currentStage as BlocoKey);
  // Operador e médico preenchem etapas; admins/globais só visualizam.
  const canEdit = user?.role === "protocolo_operador" || user?.role === "protocolo_medico";
  // Encerrar antecipadamente: somente médico.
  const canEncerrar = user?.role === "protocolo_medico";
  // Identidade do responsável vem do usuário logado (sem digitar a cada etapa).
  const responsavel = { nome: user?.name ?? "", registro: user?.registroProfissional ?? "" };

  // Configuração por bloco: dado salvo, rascunho e mutação de fechamento.
  const blocoConfig: Record<BlocoKey, { initial: unknown; rascunho: unknown; mutate: (p: never) => void; pending: boolean }> = {
    triagem: { initial: protocolo.triagem, rascunho: protocolo.triagemRascunho, mutate: (p) => mTriagem.mutate(p), pending: mTriagem.isPending },
    ecg: { initial: protocolo.ecg, rascunho: protocolo.ecgRascunho, mutate: (p) => mEcg.mutate(p), pending: mEcg.isPending },
    investigacao: { initial: protocolo.investigacao, rascunho: protocolo.investigacaoRascunho, mutate: (p) => mInvestigacao.mutate(p), pending: mInvestigacao.isPending },
    desfecho: { initial: protocolo.desfecho, rascunho: protocolo.desfechoRascunho, mutate: (p) => mDesfecho.mutate(p), pending: mDesfecho.isPending },
  };

  // mode: "view" = leitura · "fill" = preencher etapa atual (fecha) · "edit" = editar etapa
  // concluída · "draft" = adiantar etapa futura (só rascunho, fecha quando for a vez dela)
  const renderBlock = (key: BlocoKey, mode: "view" | "fill" | "edit" | "draft") => {
    const cfg = blocoConfig[key];
    const Form = BLOCO_FORM[key] as React.ComponentType<BlocoFormCommonProps>;
    const editando = mode === "edit";
    const onSubmit = editando
      ? (dados: Record<string, unknown>) =>
          mEditar.mutate({ bloco: key, dados: { ...dados, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro } })
      : (cfg.mutate as (p: Record<string, unknown>) => void);
    const draftProps =
      mode === "fill" || mode === "draft"
        ? { rascunho: cfg.rascunho, onDraftChange: (d: Record<string, unknown>) => saveDraft(key, d) }
        : {};
    return (
      <Form
        initial={cfg.initial}
        readOnly={mode === "view"}
        draftOnly={mode === "draft"}
        submitLabel={editando ? "Salvar alterações" : undefined}
        submitting={cfg.pending || mEditar.isPending}
        onSubmit={onSubmit}
        responsavel={responsavel}
        {...draftProps}
      />
    );
  };

  /** Cabeçalho de uma etapa concluída com botão de editar (operador/médico). */
  const ClosedStageBody = (b: BlocoKey) => {
    const emEdicao = editBlocos.includes(b);
    return (
      <>
        {canEdit && (
          <div className="flex justify-end mb-2">
            <Button variant={emEdicao ? "outline" : "ghost"} size="sm" onClick={() => toggleEdit(b)}>
              <Pencil size={14} /> {emEdicao ? "Cancelar edição" : "Editar etapa"}
            </Button>
          </div>
        )}
        {renderBlock(b, emEdicao ? "edit" : "view")}
      </>
    );
  };

  const PatientHeader = (
    <Card shadow="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text variant="heading-sm" className="text-gray-400 block truncate">{protocolo.pacienteNome}</Text>
          <Text variant="caption" className="text-gray-300">
            {protocolo.numeroProntuario && `Prontuário ${protocolo.numeroProntuario} · `}
            {protocolo.idade && `${protocolo.idade} anos · `}
            {protocolo.sexo && `${({ M: "Masculino", F: "Feminino", O: "Outro" } as Record<string, string>)[protocolo.sexo] ?? protocolo.sexo} · `}
            {protocolo.dataAtendimento && `Atend. ${protocolo.dataAtendimento} · `}
            {protocolo.horaChegada && `Chegada ${protocolo.horaChegada}`}
          </Text>
        </div>
        <StageBadge stage={protocolo.currentStage} />
      </div>
    </Card>
  );

  // Resumo de quem fechou/alterou cada etapa (com hora e nº de campos) — quem opera vê.
  const HistoricoResumo = canEdit && (protocolo.historicoAcoes?.length ?? 0) > 0 && (
    <Card shadow="sm" padding="sm">
      <div className="flex items-center gap-2 px-2 py-1">
        <History size={16} className="text-gray-300" />
        <Text variant="body-sm-bold" className="text-gray-300">Registro de alterações</Text>
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {historicoOrdenado.map((a, i) => (
          <HistoricoLinha key={i} acao={a} />
        ))}
      </div>
    </Card>
  );

  const EncerrarBar = canEncerrar && !concluido && (
    <Card shadow="sm" className="border border-red-base/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Text variant="body-sm-bold" className="text-gray-400">Encerrar protocolo</Text>
          <Text variant="caption" className="text-gray-300">Por não-continuidade ou não-indicação (somente médico).</Text>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEncerrarOpen(true)}>
          <Ban size={16} /> Encerrar
        </Button>
      </div>
    </Card>
  );

  // Etapas que não são a atual: concluídas (ver/editar) e futuras (adiantar como rascunho).
  // Operador/médico podem preencher qualquer uma sem fechar a etapa atual; o fechamento
  // oficial continua na ordem do fluxo.
  const nonActiveBlocos = BLOCOS.filter((b) => b !== activeKey);
  const OutrasEtapas = !concluido && nonActiveBlocos.length > 0 && (
    <div className="flex flex-col gap-3">
      <Text variant="body-sm-bold" className="text-gray-300 px-1">Outras etapas</Text>
      {nonActiveBlocos.map((b) => {
        const isCompleted = ORDER[b] < currentIndex;
        const open = openBlocos.includes(b);
        const temRascunho = !!blocoConfig[b].rascunho;
        return (
          <Card key={b} shadow="sm">
            <button
              type="button"
              onClick={() => toggleBloco(b)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCompleted ? (
                  <Check size={16} className="text-green-base shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full border-2 border-gray-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <Text variant="body-md-bold" className="text-gray-400">{STAGE_META[b].titulo}</Text>
                  <Text variant="caption" className="text-gray-300 block truncate">
                    {isCompleted
                      ? "Concluída — toque para ver ou editar"
                      : canEdit
                        ? temRascunho
                          ? "Rascunho salvo — toque para continuar"
                          : "Adiantar preenchimento (rascunho)"
                        : "Ainda não iniciada"}
                  </Text>
                </div>
              </div>
              {open ? <ChevronUp size={18} className="text-gray-300 shrink-0" /> : <ChevronDown size={18} className="text-gray-300 shrink-0" />}
            </button>
            {open && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {isCompleted ? (
                  ClosedStageBody(b)
                ) : canEdit ? (
                  renderBlock(b, "draft")
                ) : (
                  <Text variant="body-sm" className="text-gray-300">Etapa ainda não iniciada.</Text>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        <button
          type="button"
          onClick={backToList}
          className="flex items-center gap-1.5 text-teal-base hover:text-teal-dark text-sm font-semibold font-sans self-start"
        >
          <ArrowLeft size={16} /> Voltar para a lista
        </button>

        {PatientHeader}

        {/* CONCLUÍDO — todas as etapas em leitura */}
        {concluido && (
          <>
            {protocolo.encerramento ? (
              <div className="rounded-xl bg-red-base/10 text-red-base px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Ban size={18} />
                  <Text variant="body-sm-bold" className="text-red-base">
                    Protocolo encerrado — {protocolo.encerramento.motivo === "nao_continuidade" ? "não-continuidade" : "não-indicação"}.
                  </Text>
                </div>
                {protocolo.encerramento.observacao && (
                  <Text variant="caption" className="text-red-base/80">{protocolo.encerramento.observacao}</Text>
                )}
                <Text variant="caption" className="text-red-base/80">
                  Por {protocolo.encerramento.encerradoPorNome}
                  {protocolo.encerramento.encerradoPorRegistro ? ` (${protocolo.encerramento.encerradoPorRegistro})` : ""}
                  {" · etapa "}{STAGE_META[protocolo.encerramento.etapaNoEncerramento as BlocoKey]?.titulo ?? protocolo.encerramento.etapaNoEncerramento}
                </Text>
              </div>
            ) : (
              <div className="rounded-xl bg-green-base/10 text-green-base px-4 py-3 flex items-center gap-2">
                <Check size={18} />
                <Text variant="body-sm-bold" className="text-green-base">Protocolo concluído.</Text>
              </div>
            )}
            {BLOCOS.map((b) => {
              const bloco = protocolo[b];
              const open = openBlocos.includes(b);
              return (
                <Card key={b} shadow="sm">
                  <button
                    type="button"
                    onClick={() => toggleBloco(b)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {bloco ? <Check size={16} className="text-green-base shrink-0" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-200 shrink-0" />}
                      <div className="min-w-0">
                        <Text variant="body-md-bold" className="text-gray-400">{STAGE_META[b].titulo}</Text>
                        {bloco && (
                          <Text variant="caption" className="text-gray-300 block truncate">
                            {bloco.responsavelNome}
                            {bloco.registroProfissional ? ` (${bloco.registroProfissional})` : ""}
                          </Text>
                        )}
                      </div>
                    </div>
                    {open ? <ChevronUp size={18} className="text-gray-300 shrink-0" /> : <ChevronDown size={18} className="text-gray-300 shrink-0" />}
                  </button>
                  {open && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {ClosedStageBody(b)}
                    </div>
                  )}
                </Card>
              );
            })}
            {HistoricoResumo}
          </>
        )}

        {/* ETAPA EM ABERTO (não concluído): etapa atual + outras etapas (rascunho/edição) */}
        {!concluido && activeKey && (
          <>
            {!editando ? (
              <Card shadow="sm" className="border-2 border-teal-light">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={20} className="text-teal-base" />
                    <span className="protocolo-open-dot" title="Etapa em andamento" />
                    <Text variant="body-md-bold" className="text-gray-400">
                      {canEdit ? "Etapa em andamento" : "Etapa em aberto"}: {STAGE_META[activeKey].titulo}
                    </Text>
                  </div>
                  <Text variant="body-sm" className="text-gray-300">
                    Responsável: {STAGE_META[activeKey].equipe}
                  </Text>
                  {canEdit ? (
                    <>
                      {!responsavel.registro && (
                        <Text variant="caption" className="text-amber-600">
                          Seu cadastro não tem registro profissional. Peça ao administrador para incluí-lo.
                        </Text>
                      )}
                      <Button className="self-start" onClick={() => (responsavel.registro ? setEditando(true) : setGateOpen(true))}>
                        Continuar etapa {STAGE_META[activeKey].titulo}
                      </Button>
                    </>
                  ) : (
                    <Text variant="body-sm" className="text-gray-300">
                      O preenchimento desta etapa é feito pelo operador/médico.
                    </Text>
                  )}
                </div>
              </Card>
            ) : canEdit ? (
              <Card shadow="sm" className="border-2 border-teal-light">
                <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="protocolo-open-dot" title="Etapa em andamento" />
                    <Text variant="body-md-bold" className="text-gray-400">{STAGE_META[activeKey].titulo}</Text>
                  </div>
                  <Text variant="caption" className="text-gray-300">
                    {responsavel.nome}{responsavel.registro ? ` · ${responsavel.registro}` : ""}
                  </Text>
                </div>
                {renderBlock(activeKey, "fill")}
              </Card>
            ) : null}

            {OutrasEtapas}

            {HistoricoResumo}
            {EncerrarBar}
          </>
        )}
      </div>

      {/* Sem registro no perfil — bloqueia início e orienta */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <Text as="h2" variant="heading-sm" className="text-gray-400">Registro profissional necessário</Text>
            <Text variant="body-sm" className="text-gray-300">
              Seu usuário não tem CRM/COREN cadastrado. As etapas registram o responsável a partir
              do seu cadastro — peça ao administrador para incluir seu registro profissional.
            </Text>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setGateOpen(false)}>Entendi</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: encerrar protocolo (médico) */}
      {encerrarOpen && (
        <EncerrarModal
          submitting={mEncerrar.isPending}
          onClose={() => setEncerrarOpen(false)}
          onConfirm={(motivo, observacao) =>
            mEncerrar.mutate({ motivo, observacao, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro })
          }
        />
      )}
    </div>
  );
}

/** Chip (flag) de uma alteração: "Campo  de → para". */
function ChangeFlag({ campo, de, para }: { campo: string; de: string; para: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-sans">
      <span className="font-semibold text-amber-700">{labelCampo(campo)}</span>
      <span className="text-gray-300 line-through">{labelValor(de)}</span>
      <span className="text-amber-600">→</span>
      <span className="font-semibold text-amber-700">{labelValor(para)}</span>
    </span>
  );
}

/** Linha do histórico: "Quem · ação · Etapa — data" + flags de mudança. */
function HistoricoLinha({ acao }: { acao: RegistroAcao }) {
  const fechou = acao.tipo === "fechamento";
  const quem = `${acao.porNome}${acao.porRegistro ? ` (${acao.porRegistro})` : ""}`;
  const campos = acao.campos ?? [];
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 border-t border-gray-50 first:border-t-0">
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${fechou ? "bg-green-base" : "bg-amber-500"}`} />
      <div className="min-w-0 flex flex-col gap-1">
        <Text variant="caption" className="text-gray-400">
          <span className="font-semibold">{quem}</span>{" "}
          {fechou ? "fechou" : "editou"}{" "}
          <span className="font-semibold">{BLOCO_TITULO[acao.bloco]}</span>
          {" · "}<span className="text-gray-300">{fmtDataHora(acao.em)}</span>
        </Text>
        {!fechou && campos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campos.map((c, i) => (
              <ChangeFlag key={i} campo={c.campo} de={c.de} para={c.para} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EncerrarModal({
  submitting, onClose, onConfirm,
}: {
  submitting: boolean;
  onClose: () => void;
  onConfirm: (motivo: "nao_continuidade" | "nao_indicacao", observacao: string) => void;
}) {
  const [motivo, setMotivo] = useState<"nao_continuidade" | "nao_indicacao" | "">("");
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState("");

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo) { setError("Selecione o motivo."); return; }
    if (!observacao.trim()) { setError("Descreva o motivo do encerramento."); return; }
    onConfirm(motivo, observacao.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div>
          <Text as="h2" variant="heading-sm" className="text-gray-400">Encerrar protocolo</Text>
          <Text variant="body-sm" className="text-gray-300">Esta ação conclui o protocolo na etapa atual.</Text>
        </div>
        <form onSubmit={confirm} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => setMotivo("nao_continuidade")}
              className={`px-3 py-2 rounded-xl text-sm font-sans font-semibold border-2 text-left ${motivo === "nao_continuidade" ? "border-teal-base bg-teal-light text-teal-dark" : "border-gray-200 text-gray-400"}`}>
              Não-continuidade
            </button>
            <button type="button" onClick={() => setMotivo("nao_indicacao")}
              className={`px-3 py-2 rounded-xl text-sm font-sans font-semibold border-2 text-left ${motivo === "nao_indicacao" ? "border-teal-base bg-teal-light text-teal-dark" : "border-gray-200 text-gray-400"}`}>
              Não-indicação
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Descrição *</span>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans text-gray-400 focus:outline-none focus:border-teal-base resize-none"
              placeholder="Justifique o encerramento do protocolo"
            />
          </div>
          {error && <Text variant="body-sm" className="text-red-base">{error}</Text>}
          <div className="flex gap-3 justify-end mt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Encerrando..." : "Encerrar protocolo"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
