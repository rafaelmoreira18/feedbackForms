import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { protocoloService } from "@/services/protocolo-service";
import { tenantService } from "@/services/tenant-service";
import { ROUTES } from "@/routes";
import { formatDate } from "@/utils/format";
import type { Protocolo } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import Button from "@/components/ui/button";
import { CheckCircle2, ClipboardCheck, X } from "lucide-react";
import { ALL_PROTOCOLOS, getProtocoloDef } from "../registry";

/** Data de referência do protocolo para filtro/ordenação (atendimento ou criação). */
function refDate(p: Protocolo): string {
  return (p.dataAtendimento || p.createdAt || "").slice(0, 10);
}

export default function ProtocolosConcluidos() {
  const { tenantSlug: slugFromUrl } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGlobal =
    user?.role === "protocolo_admin_global" || user?.role === "holding_admin";

  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = slugFromUrl ?? user?.tenantSlug ?? selectedSlug;

  const [protocolType, setProtocolType] = useState("dor_toracica");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants-all-active"],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal && !slugFromUrl,
  });

  // No selector de protocolos não mostramos UTIs nem a matriz Mediall
  const unidadesProtocolo = allTenants.filter(
    (t) => t.slug !== "mediall-goiania" && !/^uti(-|$)/i.test(t.slug),
  );

  const { data: concluidos = [], isLoading } = useQuery({
    queryKey: ["protocolos-concluidos", tenantSlug, protocolType],
    queryFn: () => protocoloService.getAll(tenantSlug, { protocolType, stage: "concluido" }),
    enabled: !!tenantSlug,
  });

  const filtrados = concluidos.filter((p) => {
    const d = refDate(p);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const canClearUnidade = isGlobal && !slugFromUrl;
  const hasFilters = !!startDate || !!endDate || (canClearUnidade && !!selectedSlug);

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    if (canClearUnidade) setSelectedSlug("");
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={22} className="text-teal-base" />
          <Text variant="heading-md" className="text-gray-400">
            Protocolos Concluídos — {getProtocoloDef(protocolType).shortLabel}
          </Text>
        </div>

        <Card shadow="sm">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                label="Protocolo"
                options={ALL_PROTOCOLOS.map((d) => ({ value: d.type, label: d.shortLabel }))}
                value={protocolType}
                onChange={(e) => setProtocolType(e.target.value)}
              />
              {isGlobal && !slugFromUrl && (
                <Select
                  label="Unidade"
                  options={[
                    { value: "", label: "Selecione..." },
                    ...unidadesProtocolo.map((t) => ({ value: t.slug, label: t.name })),
                  ]}
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                />
              )}
              <DateInput label="Data inicial" value={startDate} onChange={setStartDate} size="lg" />
              <DateInput label="Data final" value={endDate} onChange={setEndDate} size="lg" />
            </div>
            {hasFilters && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  <X size={16} /> Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </Card>

        {!tenantSlug ? (
          <Card shadow="sm">
            <div className="py-12 text-center">
              <Text className="text-gray-300">Selecione uma unidade.</Text>
            </div>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Card shadow="md">
            <div className="flex flex-col gap-4">
              <Text variant="heading-sm" className="text-gray-400">
                Concluídos ({filtrados.length})
              </Text>

              {filtrados.length === 0 ? (
                <div className="text-center py-12">
                  <Text variant="body-md" className="text-gray-300">
                    Nenhum protocolo concluído no período.
                  </Text>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {filtrados.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(ROUTES.protocoloForm(tenantSlug, protocolType, p.slug))}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer active:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <Text variant="body-sm-bold" className="text-gray-400">{p.pacienteNome}</Text>
                          <span className="flex items-center gap-1 text-green-base">
                            <CheckCircle2 size={16} />
                            <Text variant="caption" className="text-green-base">Concluído</Text>
                          </span>
                        </div>
                        <Text variant="caption" className="text-gray-300">
                          {p.numeroProntuario ? `Prontuário ${p.numeroProntuario} · ` : ""}
                          {formatDate(refDate(p))}
                        </Text>
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-300 font-sans">Paciente</th>
                          <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-300 font-sans">Prontuário</th>
                          <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-300 font-sans">Data atendimento</th>
                          <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-300 font-sans">Chegada</th>
                          <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-300 font-sans">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => navigate(ROUTES.protocoloForm(tenantSlug, protocolType, p.slug))}
                            className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 pr-4 font-sans text-sm text-gray-400 font-semibold">{p.pacienteNome}</td>
                            <td className="py-3 pr-4 font-sans text-sm text-gray-300">{p.numeroProntuario || "—"}</td>
                            <td className="py-3 pr-4 font-sans text-sm text-gray-300">{formatDate(refDate(p))}</td>
                            <td className="py-3 pr-4 font-sans text-sm text-gray-300">{p.horaChegada || "—"}</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold font-sans px-2.5 py-1 rounded-full bg-green-base text-white">
                                <CheckCircle2 size={14} /> Concluído
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
