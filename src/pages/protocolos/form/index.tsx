import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { protocoloService } from "@/services/protocolo-service";
import type {
  SubmitTriagemPayload,
  SubmitInvestigacaoPayload,
  SubmitDesfechoPayload,
} from "@/services/protocolo-service";
import { ROUTES } from "@/routes";
import type { ProtocoloStage } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Stethoscope } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { StageBadge } from "../index";
import { STAGE_META, type BlocoKey } from "./form-ui";
import BlocoTriagemForm from "./bloco-triagem";
import BlocoInvestigacaoForm from "./bloco-investigacao";
import BlocoDesfechoForm from "./bloco-desfecho";

const ORDER: Record<ProtocoloStage, number> = { triagem: 0, investigacao: 1, desfecho: 2, concluido: 3 };
const BLOCOS: BlocoKey[] = ["triagem", "investigacao", "desfecho"];

export default function ProtocoloForm() {
  const { tenantSlug = "", slug = "" } = useParams<{ tenantSlug: string; slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [responsavel, setResponsavel] = useState<{ nome: string; registro: string } | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [verConcluidas, setVerConcluidas] = useState(false);
  const [openBlocos, setOpenBlocos] = useState<BlocoKey[]>([]);
  const toggleBloco = (b: BlocoKey) =>
    setOpenBlocos((prev) => (prev.includes(b) ? prev.filter((k) => k !== b) : [...prev, b]));

  const { data: protocolo, isLoading } = useQuery({
    queryKey: ["protocolo", tenantSlug, slug],
    queryFn: () => protocoloService.getOne(tenantSlug, slug),
    enabled: !!tenantSlug && !!slug,
  });

  const backToList = () => {
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    navigate(ROUTES.protocolos(tenantSlug));
  };

  const onStageDone = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ["protocolo", tenantSlug, slug] });
    queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
    toast.success(msg);
    backToList(); // volta à lista de pacientes, não mostra as próximas etapas
  };

  const mTriagem = useMutation({
    mutationFn: (p: SubmitTriagemPayload) => protocoloService.submitTriagem(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Triagem fechada."),
    onError: () => toast.error("Erro ao fechar a etapa."),
  });
  const mInvestigacao = useMutation({
    mutationFn: (p: SubmitInvestigacaoPayload) => protocoloService.submitInvestigacao(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Investigação fechada."),
    onError: () => toast.error("Erro ao fechar a etapa."),
  });
  const mDesfecho = useMutation({
    mutationFn: (p: SubmitDesfechoPayload) => protocoloService.submitDesfecho(tenantSlug, slug, p),
    onSuccess: () => onStageDone("Protocolo concluído."),
    onError: () => toast.error("Erro ao concluir o protocolo."),
  });

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
  const completedKeys = BLOCOS.filter((b) => ORDER[b] < currentIndex);
  // Apenas o operador preenche/avança etapas. Admins e globais só visualizam.
  const canEdit = user?.role === "protocolo_operador";

  const renderBlock = (key: BlocoKey, readOnly: boolean) => {
    const resp = responsavel ?? { nome: "", registro: "" };
    if (key === "triagem")
      return <BlocoTriagemForm initial={protocolo.triagem} readOnly={readOnly} submitting={mTriagem.isPending} onSubmit={(p) => mTriagem.mutate(p)} responsavel={resp} />;
    if (key === "investigacao")
      return <BlocoInvestigacaoForm initial={protocolo.investigacao} readOnly={readOnly} submitting={mInvestigacao.isPending} onSubmit={(p) => mInvestigacao.mutate(p)} responsavel={resp} />;
    return <BlocoDesfechoForm initial={protocolo.desfecho} readOnly={readOnly} submitting={mDesfecho.isPending} onSubmit={(p) => mDesfecho.mutate(p)} responsavel={resp} />;
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
            <div className="rounded-xl bg-green-base/10 text-green-base px-4 py-3 flex items-center gap-2">
              <Check size={18} />
              <Text variant="body-sm-bold" className="text-green-base">Protocolo concluído.</Text>
            </div>
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
                      <Check size={16} className="text-green-base shrink-0" />
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
                      {renderBlock(b, true)}
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}

        {/* ETAPA EM ABERTO */}
        {!concluido && activeKey && responsavel === null && (
          <>
            {/* Card: começar a próxima etapa (apenas operador) */}
            <Card shadow="sm" className="border-2 border-teal-light">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Stethoscope size={20} className="text-teal-base" />
                  <Text variant="body-md-bold" className="text-gray-400">
                    {canEdit ? "Próxima etapa" : "Etapa em aberto"}: {STAGE_META[activeKey].titulo}
                  </Text>
                </div>
                <Text variant="body-sm" className="text-gray-300">
                  Responsável: {STAGE_META[activeKey].equipe}
                </Text>
                {canEdit ? (
                  <Button className="self-start" onClick={() => setGateOpen(true)}>
                    Começar etapa {STAGE_META[activeKey].titulo}
                  </Button>
                ) : (
                  <Text variant="body-sm" className="text-gray-300">
                    O preenchimento desta etapa é feito pelo operador.
                  </Text>
                )}
              </div>
            </Card>

            {/* Etapas já concluídas (recolhidas) */}
            {completedKeys.length > 0 && (
              <Card shadow="sm" padding="sm">
                <button
                  type="button"
                  onClick={() => setVerConcluidas((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-left px-2 py-1"
                >
                  <Text variant="body-sm-bold" className="text-gray-300">
                    Ver etapas concluídas ({completedKeys.length})
                  </Text>
                  {verConcluidas ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                </button>
                {verConcluidas && (
                  <div className="flex flex-col gap-4 mt-3">
                    {completedKeys.map((b) => (
                      <div key={b} className="border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Check size={16} className="text-green-base" />
                          <Text variant="body-md-bold" className="text-gray-400">{STAGE_META[b].titulo}</Text>
                        </div>
                        {renderBlock(b, true)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* FORMULÁRIO da etapa (após confirmar responsável) — apenas operador */}
        {!concluido && activeKey && responsavel !== null && canEdit && (
          <Card shadow="sm" className="border-2 border-teal-light">
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
              <Text variant="body-md-bold" className="text-gray-400">{STAGE_META[activeKey].titulo}</Text>
              <Text variant="caption" className="text-gray-300">
                {responsavel.nome}{responsavel.registro ? ` · ${responsavel.registro}` : ""}
              </Text>
            </div>
            {renderBlock(activeKey, false)}
          </Card>
        )}
      </div>

      {/* Modal: responsável pela etapa */}
      {gateOpen && activeKey && (
        <ResponsavelGate
          stageKey={activeKey}
          onClose={() => setGateOpen(false)}
          onConfirm={(nome, registro) => {
            setResponsavel({ nome, registro });
            setGateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ResponsavelGate({
  stageKey, onClose, onConfirm,
}: {
  stageKey: BlocoKey;
  onClose: () => void;
  onConfirm: (nome: string, registro: string) => void;
}) {
  const meta = STAGE_META[stageKey];
  const [nome, setNome] = useState("");
  const [registro, setRegistro] = useState("");
  const [error, setError] = useState("");

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !registro.trim()) {
      setError("Informe seu nome e o número de registro profissional.");
      return;
    }
    onConfirm(nome.trim(), registro.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div>
          <Text as="h2" variant="heading-sm" className="text-gray-400">Iniciar etapa: {meta.titulo}</Text>
          <Text variant="body-sm" className="text-gray-300">Responsável: {meta.equipe}</Text>
        </div>
        <form onSubmit={confirm} className="flex flex-col gap-4">
          <Input label="Nome do profissional *" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <Input label={`Número de registro (${meta.registroLabel}) *`} value={registro} onChange={(e) => setRegistro(e.target.value)} />
          {error && <Text variant="body-sm" className="text-red-base">{error}</Text>}
          <div className="flex gap-3 justify-end mt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm">Confirmar e continuar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
