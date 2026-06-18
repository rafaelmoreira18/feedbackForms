import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { protocoloService } from "@/services/protocolo-service";
import { tenantService } from "@/services/tenant-service";
import { ROUTES } from "@/routes";
import type { Protocolo } from "@/types";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Select from "@/components/ui/select";
import { Users, Plus, ClipboardPlus, ArrowLeft } from "lucide-react";
import { getProtocoloDef } from "./registry";
import NovoPacienteModal from "./novo-paciente-modal";

export function StageBadge({ stage, protocolType }: { stage: string; protocolType?: string }) {
  const def = getProtocoloDef(protocolType);
  return (
    <span className={`text-xs font-semibold font-sans px-2.5 py-1 rounded-full ${def.stageStyle[stage] ?? "bg-gray-200 text-gray-500"}`}>
      {def.stageLabel[stage] ?? stage}
    </span>
  );
}

export default function ProtocolosHome() {
  const { tenantSlug: slugFromUrl, protocolType = "dor_toracica" } = useParams<{
    tenantSlug: string; protocolType: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const def = getProtocoloDef(protocolType);

  const isGlobal =
    user?.role === "protocolo_admin_global" || user?.role === "holding_admin";
  const isAdmin = isGlobal || user?.role === "protocolo_admin";
  // Abrir novo protocolo: operador e médico preenchem etapas; admins/global admin só visualizam.
  const podeAbrirProtocolo =
    user?.role === "protocolo_operador" || user?.role === "protocolo_medico";

  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = slugFromUrl ?? user?.tenantSlug ?? selectedSlug;

  const [showNovo, setShowNovo] = useState(false);

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants-all-active"],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal && !slugFromUrl,
  });

  // No selector de protocolos não mostramos UTIs nem a matriz Mediall
  const unidadesProtocolo = allTenants.filter(
    (t) => t.slug !== "mediall-goiania" && !/^uti(-|$)/i.test(t.slug),
  );

  const { data: abertos = [], isLoading } = useQuery({
    queryKey: ["protocolos-abertos", tenantSlug, protocolType],
    queryFn: () => protocoloService.getAbertos(tenantSlug, protocolType),
    enabled: !!tenantSlug,
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-6 flex flex-col gap-5">
        <button
          type="button"
          onClick={() => navigate(ROUTES.protocolos(slugFromUrl))}
          className="flex items-center gap-1.5 text-teal-base hover:text-teal-dark text-sm font-semibold font-sans self-start"
        >
          <ArrowLeft size={16} /> Protocolos
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Text variant="heading-md" className="text-gray-400">{def.label}</Text>
            <Text variant="body-sm" className="text-gray-300">Protocolos em aberto da unidade</Text>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(ROUTES.protocolosUsuarios(slugFromUrl))}
              >
                <Users size={18} /> Usuários
              </Button>
            )}
          </div>
        </div>

        {isGlobal && !slugFromUrl && (
          <Card shadow="sm">
            <Select
              label="Unidade"
              options={[
                { value: "", label: "Selecione uma unidade..." },
                ...unidadesProtocolo.map((t) => ({ value: t.slug, label: t.name })),
              ]}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            />
          </Card>
        )}

        {tenantSlug && podeAbrirProtocolo && (
          <Button onClick={() => setShowNovo(true)} className="self-start">
            <Plus size={20} /> Novo paciente
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-3">
        {!tenantSlug ? (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardPlus size={40} className="text-gray-200 mb-3" />
              <Text variant="body-md" className="text-gray-300">
                Selecione uma unidade para ver os protocolos.
              </Text>
            </div>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : abertos.length === 0 ? (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardPlus size={40} className="text-gray-200 mb-3" />
              <Text variant="heading-sm" className="text-gray-400">Nenhum protocolo em aberto</Text>
              {podeAbrirProtocolo && (
                <Text variant="body-sm" className="text-gray-300 mt-1">
                  Clique em "Novo paciente" para abrir um protocolo.
                </Text>
              )}
            </div>
          </Card>
        ) : (
          abertos.map((p: Protocolo) => (
            <Card
              key={p.id}
              shadow="sm"
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-teal-light"
            >
              <button
                type="button"
                onClick={() => navigate(ROUTES.protocoloForm(tenantSlug, protocolType, p.slug))}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <Text variant="body-md-bold" className="text-gray-400 block truncate">
                    {p.pacienteNome}
                  </Text>
                  <Text variant="caption" className="text-gray-300">
                    {p.numeroProntuario ? `Prontuário ${p.numeroProntuario} · ` : ""}
                    {p.horaChegada ? `Chegada ${p.horaChegada}` : ""}
                  </Text>
                </div>
                <span className="flex items-center gap-2 shrink-0">
                  <StageBadge stage={p.currentStage} protocolType={p.protocolType} />
                  <span
                    className="protocolo-open-dot"
                    title="Protocolo em aberto"
                    aria-label="Protocolo em aberto"
                  />
                </span>
              </button>
            </Card>
          ))
        )}
      </div>

      {showNovo && tenantSlug && (
        <NovoPacienteModal
          tenantSlug={tenantSlug}
          protocolType={protocolType}
          onClose={() => setShowNovo(false)}
          onCreated={(p) => {
            setShowNovo(false);
            navigate(ROUTES.protocoloForm(tenantSlug, protocolType, p.slug));
          }}
        />
      )}
    </div>
  );
}
