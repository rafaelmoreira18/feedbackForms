import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, LineChart, Line,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { protocoloService } from "@/services/protocolo-service";
import { tenantService } from "@/services/tenant-service";
import { generateProtocoloReport } from "@/services/protocolo-report-service";
import type { ProtocoloMetrics, ProtocoloIndicador } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { FileDown } from "lucide-react";
import { ALL_PROTOCOLOS, getProtocoloDef } from "../registry";
import { sepseLabelValor } from "../sepse/constants";

/** Métricas exibidas no dashboard — superset (campos por tipo são opcionais). */
type DashMetrics = {
  total: number;
  abertos: number;
  concluidos: number;
  indicadores: Record<string, ProtocoloIndicador>;
  tendenciaMensal: { mes: string; total: number }[];
  porVia?: { via_i: number; via_ii: number; via_iii: number; naoInformado: number };
  porRiscoHeart?: { baixo: number; intermediario: number; alto: number; naoInformado: number };
  porClassificacao?: Record<string, number>;
  porFoco?: Record<string, number>;
  porDesfecho?: Record<string, number>;
  porFaixaPhoenix?: { sepse: number; choque_septico: number; incompleto: number; naoInformado: number };
};

type IndConf = { key: string; label: string; short: string };

const INDICADORES_BY_TYPE: Record<string, IndConf[]> = {
  dor_toracica: [
    { key: "portaTriagem5", label: "Porta-Triagem ≤ 5 min", short: "Porta-Triagem" },
    { key: "triagemEcg5", label: "Triagem → ECG ≤ 5 min", short: "Triagem→ECG" },
    { key: "ecgInterpretacao5", label: "ECG → Interpretação ≤ 5 min", short: "ECG→Interp." },
    { key: "portaEcg10", label: "Porta-ECG total ≤ 10 min", short: "Porta-ECG" },
    { key: "portaAgulha30", label: "Porta-Agulha ≤ 30 min", short: "Porta-Agulha" },
    { key: "eficaciaTrombolise", label: "Eficácia da trombólise", short: "Ef. trombólise" },
    { key: "transferenciaMeta", label: "Transferência dentro da meta", short: "Transferência" },
    { key: "completude", label: "Completude do protocolo", short: "Completude" },
  ],
  sepse: [
    { key: "lactato30", label: "Lactato ≤ 30 min", short: "Lactato" },
    { key: "hemoculturasAntesAtm", label: "Hemoculturas antes do ATM", short: "Hemoculturas" },
    { key: "antimicrobiano60", label: "Antimicrobiano ≤ 60 min", short: "ATM ≤ 60min" },
    { key: "reposicaoVolemica", label: "Reposição volêmica na 1ª hora", short: "Volume" },
    { key: "pacote1hCompleto", label: "Pacote de 1 hora completo", short: "Pacote 1h" },
    { key: "reavaliacaoLactato", label: "Recoleta de lactato 2–4h", short: "Recoleta lactato" },
    { key: "transferenciaUTI", label: "Transferência UTI na meta", short: "Transf. UTI" },
    { key: "completude", label: "Completude do protocolo", short: "Completude" },
  ],
};

const FOCO_LABEL: Record<string, string> = {
  pulmonar: "Pulmonar", urinario: "Urinário", abdominal: "Abdominal", peleMoles: "Pele/partes moles",
  snc: "SNC", cateter: "Cateter", endocardite: "Endocardite", naoDefinido: "Não definido", outro: "Outro",
};

export default function ProtocolosDashboard() {
  const { tenantSlug: slugFromUrl } = useParams<{ tenantSlug: string }>();
  const { user } = useAuth();
  const isGlobal = user?.role === "protocolo_admin_global" || user?.role === "holding_admin";

  const [selectedSlug, setSelectedSlug] = useState(user?.tenantSlug ?? "");
  const tenantSlug = slugFromUrl ?? user?.tenantSlug ?? selectedSlug;

  const [protocolType, setProtocolType] = useState("dor_toracica");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const def = getProtocoloDef(protocolType);
  const isSepse = protocolType === "sepse";
  const indicadores = INDICADORES_BY_TYPE[protocolType] ?? [];

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants-all-active"],
    queryFn: tenantService.getAllActive,
    enabled: isGlobal && !slugFromUrl,
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["protocolos-metrics", tenantSlug, protocolType, startDate, endDate],
    queryFn: () => protocoloService.getMetrics<DashMetrics>(tenantSlug, { protocolType, startDate, endDate }),
    enabled: !!tenantSlug,
  });

  // No selector de protocolos não mostramos UTIs nem a matriz Mediall
  const unidadesProtocolo = allTenants.filter(
    (t) => t.slug !== "mediall-goiania" && !/^uti(-|$)/i.test(t.slug),
  );

  const unidadeNome = allTenants.find((t) => t.slug === tenantSlug)?.name ?? tenantSlug;

  const barData =
    metrics &&
    indicadores.map((i) => ({
      name: i.short,
      valor: metrics.indicadores[i.key]?.percentual ?? 0,
      meta: metrics.indicadores[i.key]?.meta ?? 90,
    }));

  const dist = (rec: Record<string, number> | undefined, labelOf: (k: string) => string): [string, number][] =>
    Object.entries(rec ?? {}).map(([k, n]) => [labelOf(k), n]);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Text variant="heading-md" className="text-gray-400">Dashboard — {def.shortLabel}</Text>
          {metrics && tenantSlug && !isSepse && (
            <Button size="sm" variant="outline" onClick={() => generateProtocoloReport(metrics as unknown as ProtocoloMetrics, unidadeNome, { startDate, endDate })}>
              <FileDown size={18} /> Exportar PDF
            </Button>
          )}
        </div>

        <Card shadow="sm">
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
        </Card>

        {!tenantSlug ? (
          <Card shadow="sm"><div className="py-12 text-center"><Text className="text-gray-300">Selecione uma unidade.</Text></div></Card>
        ) : isLoading || !metrics ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Volume */}
            <div className="grid grid-cols-3 gap-3">
              <Card shadow="sm" className="flex flex-col gap-1"><Text variant="body-sm" className="text-gray-300">Total</Text><Text variant="heading-lg" className="text-blue-base">{metrics.total}</Text></Card>
              <Card shadow="sm" className="flex flex-col gap-1"><Text variant="body-sm" className="text-gray-300">Em aberto</Text><Text variant="heading-lg" className="text-teal-base">{metrics.abertos}</Text></Card>
              <Card shadow="sm" className="flex flex-col gap-1"><Text variant="body-sm" className="text-gray-300">Concluídos</Text><Text variant="heading-lg" className="text-green-base">{metrics.concluidos}</Text></Card>
            </div>

            {/* Indicadores cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {indicadores.map((i) => {
                const ind = metrics.indicadores[i.key];
                if (!ind) return null;
                const atinge = ind.percentual >= ind.meta;
                return (
                  <Card key={i.key} shadow="sm" className="flex flex-col gap-1">
                    <Text variant="caption" className="text-gray-300">{i.label}</Text>
                    <Text variant="heading-md" className={atinge ? "text-green-base" : "text-red-base"}>{ind.percentual}%</Text>
                    <Text variant="caption" className="text-gray-300">
                      Meta ≥ {ind.meta}% · {ind.numerador}/{ind.denominador}
                    </Text>
                  </Card>
                );
              })}
            </div>

            {/* Bar chart de indicadores */}
            <Card shadow="sm">
              <Text variant="body-md-bold" className="text-gray-400 mb-3">Indicadores vs meta</Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <ReferenceLine y={90} stroke="#1a5276" strokeDasharray="4 4" label={{ value: "Meta 90%", position: "right", fontSize: 10 }} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {barData?.map((d, idx) => (
                      <Cell key={idx} fill={d.valor >= d.meta ? "#52a350" : "#e74c3c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Distribuições */}
            {isSepse ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Classificação</Text>
                  <Dist row={dist(metrics.porClassificacao, sepseLabelValor)} />
                </Card>
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Foco principal</Text>
                  <Dist row={dist(metrics.porFoco, (k) => FOCO_LABEL[k] ?? k)} />
                </Card>
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Desfecho</Text>
                  <Dist row={dist(metrics.porDesfecho, sepseLabelValor)} />
                </Card>
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Phoenix (pediátrico)</Text>
                  <Dist row={[
                    ["Sepse", metrics.porFaixaPhoenix?.sepse ?? 0],
                    ["Choque séptico", metrics.porFaixaPhoenix?.choque_septico ?? 0],
                    ["Incompleto", metrics.porFaixaPhoenix?.incompleto ?? 0],
                    ["N/I", metrics.porFaixaPhoenix?.naoInformado ?? 0],
                  ]} />
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Resultado do ECG (VIA)</Text>
                  <Dist row={[["VIA I", metrics.porVia?.via_i ?? 0], ["VIA II", metrics.porVia?.via_ii ?? 0], ["VIA III", metrics.porVia?.via_iii ?? 0], ["N/I", metrics.porVia?.naoInformado ?? 0]]} />
                </Card>
                <Card shadow="sm">
                  <Text variant="body-md-bold" className="text-gray-400 mb-2">Risco HEART</Text>
                  <Dist row={[["Baixo", metrics.porRiscoHeart?.baixo ?? 0], ["Intermediário", metrics.porRiscoHeart?.intermediario ?? 0], ["Alto", metrics.porRiscoHeart?.alto ?? 0], ["N/I", metrics.porRiscoHeart?.naoInformado ?? 0]]} />
                </Card>
              </div>
            )}

            {/* Tendência mensal */}
            {metrics.tendenciaMensal.length > 0 && (
              <Card shadow="sm">
                <Text variant="body-md-bold" className="text-gray-400 mb-3">Protocolos por mês</Text>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={metrics.tendenciaMensal} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#00b4c8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Dist({ row }: { row: [string, number][] }) {
  const total = row.reduce((sum, [, n]) => sum + n, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      {row.map(([label, n]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs font-sans text-gray-400 w-28 shrink-0">{label}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-base rounded-full" style={{ width: `${(n / total) * 100}%` }} />
          </div>
          <span className="text-xs font-sans text-gray-300 w-8 text-right">{n}</span>
        </div>
      ))}
    </div>
  );
}
