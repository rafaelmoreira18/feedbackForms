import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { protocoloService } from "@/services/protocolo-service";
import type { SubmitBlocoPayload, EncerrarPayload } from "@/services/protocolo-service";
import { tenantService } from "@/services/tenant-service";
import { ROUTES } from "@/routes";
import type { RegistroAcao } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Stethoscope, Ban, Pencil, History, FastForward } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { StageBadge } from "../index";
import { getProtocoloDef, type ProtocoloDef, type BlocoFormCommonProps } from "../registry";
import { extractApiError, fmtDataHora } from "../utils";

export default function ProtocoloForm() {
  const { tenantSlug = "", protocolType = "", slug = "" } = useParams<{
    tenantSlug: string; protocolType: string; slug: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [gateOpen, setGateOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [encerrarOpen, setEncerrarOpen] = useState(false);
  const [verConcluidas, setVerConcluidas] = useState(false);
  const [openBlocos, setOpenBlocos] = useState<string[]>([]);
  // Etapas concluídas que o usuário abriu para EDITAR.
  const [editBlocos, setEditBlocos] = useState<string[]>([]);
  const toggleBloco = (b: string) =>
    setOpenBlocos((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));
  const toggleEdit = (b: string) =>
    setEditBlocos((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));
  // Próximas etapas abertas para preenchimento adiantado (rascunho), sem fechar a atual.
  const [verProximas, setVerProximas] = useState(false);
  const [proximasAbertas, setProximasAbertas] = useState<string[]>([]);
  const toggleProxima = (b: string) =>
    setProximasAbertas((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));

  const { data: protocolo, isLoading } = useQuery({
    queryKey: ["protocolo", tenantSlug, slug],
    queryFn: () => protocoloService.getOne(tenantSlug, slug),
    enabled: !!tenantSlug && !!slug,
  });

  // Config do tenant — usada p/ o modo padrão de resultado de troponina em novas coletas.
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", tenantSlug],
    queryFn: () => tenantService.getBySlug(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });

  // Rascunhos com salvamento por debounce — guardamos o último estado pendente por etapa
  // para poder salvar imediatamente ("flush") ao sair, sem perder alterações não salvas.
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingDrafts = useRef<Record<string, Record<string, unknown>>>({});

  const clearPending = (bloco: string) => {
    clearTimeout(draftTimers.current[bloco]);
    delete draftTimers.current[bloco];
    delete pendingDrafts.current[bloco];
  };

  const flushDrafts = useCallback(async () => {
    const entries = Object.entries(pendingDrafts.current);
    pendingDrafts.current = {};
    Object.values(draftTimers.current).forEach((t) => clearTimeout(t));
    draftTimers.current = {};
    await Promise.all(
      entries.map(([bloco, dados]) =>
        protocoloService.saveRascunho(tenantSlug, slug, bloco, dados).catch(() => {}),
      ),
    );
  }, [tenantSlug, slug]);

  const backToList = async () => {
    await flushDrafts();
    queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    navigate(ROUTES.protocolosLista(tenantSlug, protocolType));
  };

  // Salva rascunhos pendentes também ao desmontar (header, voltar do navegador, etc.).
  useEffect(() => {
    return () => {
      Object.entries(pendingDrafts.current).forEach(([bloco, dados]) =>
        protocoloService.saveRascunho(tenantSlug, slug, bloco, dados).catch(() => {}),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStageDone = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    toast.success(msg);
    setEditando(false);
    backToList();
  };

  const mSubmit = useMutation({
    mutationFn: ({ stageKey, payload }: { stageKey: string; payload: SubmitBlocoPayload }) =>
      protocoloService.submitBloco(tenantSlug, slug, stageKey, payload),
    onSuccess: (data, vars) => {
      clearPending(vars.stageKey); // etapa fechada: descarta rascunho pendente dela
      onStageDone(data.currentStage === "concluido" ? "Protocolo concluído." : "Etapa fechada.");
    },
    onError: (e) => toast.error(extractApiError(e, "Erro ao fechar a etapa.")),
  });

  const mEncerrar = useMutation({
    mutationFn: (p: EncerrarPayload) => protocoloService.encerrar(tenantSlug, slug, p),
    onSuccess: () => { setEncerrarOpen(false); onStageDone("Protocolo encerrado."); },
    onError: (e) => toast.error(extractApiError(e, "Erro ao encerrar o protocolo.")),
  });

  // Edição de etapa já concluída — não muda de etapa, só registra a alteração.
  const mEditar = useMutation({
    mutationFn: ({ stageKey, dados }: { stageKey: string; dados: SubmitBlocoPayload }) =>
      protocoloService.editarBloco(tenantSlug, slug, stageKey, dados),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
      setEditBlocos((prev) => prev.filter((k) => k !== vars.stageKey));
      toast.success("Alterações salvas.");
    },
    onError: (e) => toast.error(extractApiError(e, "Erro ao salvar alterações.")),
  });

  // Auto-save de rascunho (debounce) — registra o último estado pendente por etapa.
  const saveDraft = useCallback(
    (bloco: string, dados: Record<string, unknown>) => {
      pendingDrafts.current[bloco] = dados;
      clearTimeout(draftTimers.current[bloco]);
      draftTimers.current[bloco] = setTimeout(() => {
        const d = pendingDrafts.current[bloco];
        delete pendingDrafts.current[bloco];
        delete draftTimers.current[bloco];
        if (d) protocoloService.saveRascunho(tenantSlug, slug, bloco, d).catch(() => {});
      }, 800);
    },
    [tenantSlug, slug],
  );

  // Histórico ordenado do mais recente ao mais antigo (memoizado).
  const historicoOrdenado = useMemo(
    () => [...(protocolo?.historicoAcoes ?? [])].sort((a, b) => b.em.localeCompare(a.em)),
    [protocolo?.historicoAcoes],
  );

  // Aguardamos também o tenant: o modo padrão de troponina alimenta o estado inicial
  // do bloco (useState roda 1x), então precisa estar resolvido antes de montar o form.
  if (isLoading || tenantLoading || !protocolo) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const def = getProtocoloDef(protocolo.protocolType);
  const variante = protocolo.variante || undefined;

  // Uma etapa está FECHADA quando há bloco salvo (blocos[key]); rascunho não conta.
  const isClosed = (b: string) => (protocolo.blocos?.[b] ?? null) != null;
  const concluido = protocolo.currentStage === "concluido";
  const activeKey = concluido ? null : protocolo.currentStage;
  const closedKeys = def.stages.filter(isClosed);
  // Etapas livres: demais etapas ainda não fechadas (além da atual) podem ser preenchidas/fechadas fora de ordem.
  const outrasEtapas = def.stages.filter((b) => !isClosed(b) && b !== protocolo.currentStage);
  // Operador e médico preenchem etapas; admins/globais só visualizam.
  const canEdit = user?.role === "protocolo_operador" || user?.role === "protocolo_medico";
  // Encerrar antecipadamente: somente médico.
  const canEncerrar = user?.role === "protocolo_medico";
  // Identidade do responsável vem do usuário logado (sem digitar a cada etapa).
  const responsavel = { nome: user?.name ?? "", registro: user?.registroProfissional ?? "" };
  const troponinaModoPadrao = tenant?.troponinaModoPadrao ?? "quantitativo";

  const blocoInicial = (key: string) => (protocolo.blocos?.[key] ?? null) as unknown;
  const blocoRascunho = (key: string) => (protocolo.rascunhos?.[key] ?? null) as unknown;

  // mode: "view" = leitura · "fill" = preencher etapa atual · "edit" = editar concluída · "draft" = adiantar (rascunho)
  const renderBlock = (key: string, mode: "view" | "fill" | "edit" | "draft") => {
    const Form = def.blockForm[key] as React.ComponentType<BlocoFormCommonProps>;
    if (!Form) return null;
    const emEdicao = mode === "edit";
    const onSubmit = emEdicao
      ? (dados: Record<string, unknown>) =>
          mEditar.mutate({ stageKey: key, dados: { ...dados, responsavelNome: responsavel.nome, registroProfissional: responsavel.registro } as SubmitBlocoPayload })
      : (dados: Record<string, unknown>) =>
          mSubmit.mutate({ stageKey: key, payload: dados as SubmitBlocoPayload });
    const draftProps =
      mode === "fill" || mode === "draft"
        ? {
            rascunho: blocoRascunho(key),
            onDraftChange: (d: Record<string, unknown>) => saveDraft(key, d),
            draftOnly: mode === "draft",
          }
        : {};
    return (
      <Form
        initial={blocoInicial(key)}
        readOnly={mode === "view"}
        submitLabel={emEdicao ? "Salvar alterações" : undefined}
        submitting={mSubmit.isPending || mEditar.isPending}
        onSubmit={onSubmit}
        responsavel={responsavel}
        variante={variante}
        troponinaModoPadrao={troponinaModoPadrao}
        {...draftProps}
      />
    );
  };

  /** Cabeçalho de uma etapa concluída com botão de editar (operador/médico). */
  const ClosedStageBody = (b: string) => {
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

  const sexoLabel = ({ M: "Masculino", F: "Feminino", O: "Outro" } as Record<string, string>)[protocolo.sexo] ?? protocolo.sexo;
  const varianteLabel = variante === "pediatrico" ? "Pediátrico" : variante === "adulto" ? "Adulto" : "";

  const PatientHeader = (
    <Card shadow="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text variant="heading-sm" className="text-gray-400 block truncate">{protocolo.pacienteNome}</Text>
          <Text variant="caption" className="text-gray-300">
            {protocolo.numeroProntuario && `Prontuário ${protocolo.numeroProntuario} · `}
            {protocolo.idade && `${protocolo.idade} anos · `}
            {protocolo.pesoKg && `${protocolo.pesoKg} kg · `}
            {varianteLabel && `${varianteLabel} · `}
            {protocolo.sexo && `${sexoLabel} · `}
            {protocolo.dataAtendimento && `Atend. ${protocolo.dataAtendimento} · `}
            {protocolo.horaChegada && `Chegada ${protocolo.horaChegada}`}
          </Text>
        </div>
        <StageBadge stage={protocolo.currentStage} protocolType={protocolo.protocolType} />
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
          <HistoricoLinha key={i} acao={a} def={def} />
        ))}
      </div>
    </Card>
  );

  const EncerrarBar = canEncerrar && !concluido && (
    <Card shadow="sm" className="border border-red-base/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Text variant="body-sm-bold" className="text-gray-400">Encerrar protocolo</Text>
          <Text variant="caption" className="text-gray-300">Por não-continuidade ou não-indicação.</Text>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEncerrarOpen(true)}>
          <Ban size={16} /> Encerrar
        </Button>
      </div>
    </Card>
  );

  // Etapas livres: preencher/fechar as demais etapas fora de ordem (sem fechar a atual).
  // Com registro profissional → pode fechar direto (campos obrigatórios preenchidos);
  // sem registro → só rascunho (salvo automaticamente).
  const ProximasEtapas = canEdit && !concluido && outrasEtapas.length > 0 && (
    <Card shadow="sm" padding="sm">
      <button
        type="button"
        onClick={() => setVerProximas((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left px-2 py-1"
      >
        <div className="flex items-center gap-2">
          <FastForward size={16} className="text-teal-base" />
          <Text variant="body-sm-bold" className="text-gray-300">
            Outras etapas ({outrasEtapas.length})
          </Text>
        </div>
        {verProximas ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
      </button>
      {verProximas && (
        <div className="flex flex-col gap-3 mt-3">
          <Text variant="caption" className="text-gray-300 px-2">
            Você pode preencher e <b>fechar qualquer etapa fora de ordem</b>, desde que os campos
            obrigatórios estejam preenchidos — sem precisar fechar a etapa atual primeiro.
          </Text>
          {outrasEtapas.map((b) => {
            const aberta = proximasAbertas.includes(b);
            return (
              <div key={b} className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => toggleProxima(b)}
                  className="w-full flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {blocoRascunho(b) ? (
                      <span className="protocolo-open-dot" title="Rascunho salvo" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-200 shrink-0" />
                    )}
                    <Text variant="body-md-bold" className="text-gray-400">{def.stageMeta[b]?.titulo ?? b}</Text>
                  </div>
                  {aberta ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                </button>
                {aberta && (
                  <div className="mt-2">{renderBlock(b, responsavel.registro ? "fill" : "draft")}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
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
                  {" · etapa "}{def.stageMeta[protocolo.encerramento.etapaNoEncerramento]?.titulo ?? protocolo.encerramento.etapaNoEncerramento}
                </Text>
              </div>
            ) : (
              <div className="rounded-xl bg-green-base/10 text-green-base px-4 py-3 flex items-center gap-2">
                <Check size={18} />
                <Text variant="body-sm-bold" className="text-green-base">Protocolo concluído.</Text>
              </div>
            )}
            {def.stages.map((b) => {
              const bloco = blocoInicial(b) as { responsavelNome?: string; registroProfissional?: string } | null;
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
                        <Text variant="body-md-bold" className="text-gray-400">{def.stageMeta[b]?.titulo ?? b}</Text>
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

        {/* ETAPA EM ABERTO — antes de começar a editar */}
        {!concluido && activeKey && !editando && (
          <>
            <Card shadow="sm" className="border-2 border-teal-light">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Stethoscope size={20} className="text-teal-base" />
                  <span className="protocolo-open-dot" title="Etapa em andamento" />
                  <Text variant="body-md-bold" className="text-gray-400">
                    {canEdit ? "Etapa em andamento" : "Etapa em aberto"}: {def.stageMeta[activeKey]?.titulo ?? activeKey}
                  </Text>
                </div>
                <Text variant="body-sm" className="text-gray-300">
                  Responsável: {def.stageMeta[activeKey]?.equipe}
                </Text>
                {canEdit ? (
                  <>
                    {!responsavel.registro && (
                      <Text variant="caption" className="text-amber-600">
                        Seu cadastro não tem registro profissional. Peça ao administrador para incluí-lo.
                      </Text>
                    )}
                    <Button className="self-start" onClick={() => (responsavel.registro ? setEditando(true) : setGateOpen(true))}>
                      Continuar etapa {def.stageMeta[activeKey]?.titulo ?? activeKey}
                    </Button>
                  </>
                ) : (
                  <Text variant="body-sm" className="text-gray-300">
                    O preenchimento desta etapa é feito pelo operador/médico.
                  </Text>
                )}
              </div>
            </Card>

            {/* Etapas já fechadas (recolhidas) */}
            {closedKeys.length > 0 && (
              <Card shadow="sm" padding="sm">
                <button
                  type="button"
                  onClick={() => setVerConcluidas((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-left px-2 py-1"
                >
                  <Text variant="body-sm-bold" className="text-gray-300">
                    Ver etapas concluídas ({closedKeys.length})
                  </Text>
                  {verConcluidas ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                </button>
                {verConcluidas && (
                  <div className="flex flex-col gap-4 mt-3">
                    {closedKeys.map((b) => (
                      <div key={b} className="border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Check size={16} className="text-green-base" />
                          <Text variant="body-md-bold" className="text-gray-400">{def.stageMeta[b]?.titulo ?? b}</Text>
                        </div>
                        {ClosedStageBody(b)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {ProximasEtapas}
            {HistoricoResumo}
            {EncerrarBar}
          </>
        )}

        {/* FORMULÁRIO da etapa (após confirmar) — operador/médico */}
        {!concluido && activeKey && editando && canEdit && (
          <>
            <Card shadow="sm" className="border-2 border-teal-light">
              <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="protocolo-open-dot" title="Etapa em andamento" />
                  <Text variant="body-md-bold" className="text-gray-400">{def.stageMeta[activeKey]?.titulo ?? activeKey}</Text>
                </div>
                <Text variant="caption" className="text-gray-300">
                  {responsavel.nome}{responsavel.registro ? ` · ${responsavel.registro}` : ""}
                </Text>
              </div>
              {renderBlock(activeKey, "fill")}
            </Card>
            {ProximasEtapas}
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
function ChangeFlag({ campo, de, para, def }: { campo: string; de: string; para: string; def: ProtocoloDef }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-sans">
      <span className="font-semibold text-amber-700">{def.labelCampo(campo)}</span>
      <span className="text-gray-300 line-through">{def.labelValor(de)}</span>
      <span className="text-amber-600">→</span>
      <span className="font-semibold text-amber-700">{def.labelValor(para)}</span>
    </span>
  );
}

/** Linha do histórico: "Quem · ação · Etapa — data" + flags de mudança. */
function HistoricoLinha({ acao, def }: { acao: RegistroAcao; def: ProtocoloDef }) {
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
          <span className="font-semibold">{def.stageMeta[acao.bloco]?.titulo ?? acao.bloco}</span>
          {" · "}<span className="text-gray-300">{fmtDataHora(acao.em)}</span>
        </Text>
        {!fechou && campos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campos.map((c, i) => (
              <ChangeFlag key={i} campo={c.campo} de={c.de} para={c.para} def={def} />
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
