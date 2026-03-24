import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ROUTES } from "@/routes";
import { form3Service, getScaleAverage, getNpsScore } from "@/services/form3-service";
import { tenantService } from "@/services/tenant-service";
import { formatDate } from "@/utils/format";
import { RATING4_LABELS, RATING4_EMOJI_URLS, RATING4_BADGE_STYLES } from "@/config/rating4-config";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const INACTIVE_STYLE = "bg-white border-gray-200 text-gray-300 opacity-40";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="body-sm" className="text-gray-300">{label}</Text>
      <Text variant="body-md-bold" className="text-gray-400">{value}</Text>
    </div>
  );
}

function RatingDisplay({ value }: { value: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map((r) => {
        const isActive = value === r;
        return (
          <div
            key={r}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${
              isActive ? RATING4_BADGE_STYLES[r] : INACTIVE_STYLE
            }`}
          >
            {isActive && (
              <img
                src={RATING4_EMOJI_URLS[r]}
                alt={RATING4_LABELS[r]}
                width={20}
                height={20}
                className="shrink-0"
              />
            )}
            <span>{RATING4_LABELS[r]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SubReasonReadonly({
  reasons,
  selectedReasons,
  note,
  rating,
}: {
  reasons: [string, string, string];
  selectedReasons: string[];
  note?: string;
  rating: 1 | 2;
}) {
  const isRuim = rating === 1;
  const borderColor = isRuim ? "border-red-300" : "border-amber-300";
  const bgColor = isRuim ? "bg-red-50" : "bg-amber-50";
  const labelColor = isRuim ? "text-red-700" : "text-amber-700";

  const hasContent = selectedReasons.length > 0 || (note && note.trim().length > 0);
  if (!hasContent) return null;

  return (
    <div className={`mt-2 rounded-2xl border-l-4 ${borderColor} ${bgColor} p-4 flex flex-col gap-3`}>
      <p className={`text-xs font-semibold uppercase tracking-wider font-sans ${labelColor}`}>
        Motivos indicados
      </p>
      {reasons.map((reason) => {
        const isSelected = selectedReasons.includes(reason);
        if (!isSelected) return null;
        return (
          <div
            key={reason}
            className="w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-sans leading-snug bg-blue-light border-blue-base text-blue-dark font-semibold"
          >
            <span className="mr-2">✓</span>
            {reason}
          </div>
        );
      })}
      {note && note.trim().length > 0 && (
        <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-sans text-gray-400">
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1">Outro</span>
          {note}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Form3Preview() {
  const { tenantSlug = "", id } = useParams<{ tenantSlug: string; id: string }>();
  const navigate = useNavigate();

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["form3", tenantSlug, id],
    queryFn: () => form3Service.getById(tenantSlug, id!),
    enabled: !!tenantSlug && !!id,
    throwOnError: (err) => { toast.error(`Erro ao carregar resposta: ${(err as Error).message}`); return false; },
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["form-template", tenantSlug, form?.formType],
    queryFn: () => tenantService.getFormTemplate(tenantSlug, form!.formType),
    enabled: !!form,
  });

  const loading = formLoading || templateLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text variant="body-md" className="text-gray-300">Carregando...</Text>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center" shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-md" className="text-gray-400">Formulário não encontrado</Text>
            <Button onClick={() => navigate(ROUTES.analytics(tenantSlug))}>Voltar ao Analytics</Button>
          </div>
        </Card>
      </div>
    );
  }

  const avgScale = getScaleAverage(form);
  const nps = getNpsScore(form);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Text as="h1" variant="heading-md" className="text-gray-400">
              Respostas — {form.formType}
            </Text>
            <span className="text-[10px] text-gray-300 font-mono select-all">{form.id}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>

        {/* Patient Info */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">Informações do Paciente</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Nome" value={form.patientName} />
              <InfoItem
                label="CPF"
                value={form.patientCpf
                  ? form.patientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                  : "—"}
              />
              <InfoItem label="Idade" value={`${form.patientAge} anos`} />
              <InfoItem label="Gênero" value={form.patientGender} />
              <InfoItem label="Data de Admissão" value={formatDate(form.admissionDate)} />
              <InfoItem label="Data de Alta / Atendimento" value={formatDate(form.dischargeDate)} />
              <InfoItem label="Data da Resposta" value={formatDate(form.createdAt)} />
              <InfoItem label="Média de Satisfação" value={`${avgScale.toFixed(1)}/4`} />
              {nps !== undefined && (
                <InfoItem
                  label="Recomendaria"
                  value={nps === 1 ? "Sim" : "Não"}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Answers by block — rendered from API template */}
        {template?.blocks.map((block) => {
          const rating4Qs = block.questions.filter((q) => q.scale === "rating4");
          const npsQuestion = block.questions.find((q) => q.scale === "nps");
          if (rating4Qs.length === 0 && !npsQuestion) return null;

          return (
            <Card key={block.id} shadow="md">
              <div className="flex flex-col gap-5">
                <Text variant="heading-sm" className="text-gray-400">{block.title}</Text>

                {rating4Qs.map((q) => {
                  const answer = form.answers.find((a) => a.questionId === q.questionKey);
                  const val = answer?.value ?? 0;
                  const selectedReasons = answer?.reasons ?? [];
                  const note = answer?.note;
                  const showSubReasons = val > 0 && val <= 2 && q.subReasons;

                  return (
                    <div key={q.id} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <Text variant="body-sm" className="text-gray-300">{q.text}</Text>
                      {val > 0 ? (
                        <RatingDisplay value={val} />
                      ) : (
                        <span className="text-xs text-gray-300 italic">Não respondido</span>
                      )}
                      {showSubReasons && (
                        <SubReasonReadonly
                          reasons={q.subReasons!}
                          selectedReasons={selectedReasons}
                          note={note}
                          rating={val as 1 | 2}
                        />
                      )}
                    </div>
                  );
                })}

                {npsQuestion && (() => {
                  const npsVal = form.answers.find((a) => a.questionId === "nps")?.value;
                  const isSim = npsVal === 1;
                  const isNao = npsVal === 0;
                  return (
                    <div className="flex flex-col gap-2 pt-2">
                      <Text variant="body-sm" className="text-gray-300">{npsQuestion.text}</Text>
                      <div className="flex gap-3">
                        <div className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base ${isSim ? "bg-green-base border-green-base text-white" : "bg-white border-gray-200 text-gray-300 opacity-40"}`}>
                          ✓ Sim
                        </div>
                        <div className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base ${isNao ? "bg-red-base border-red-base text-white" : "bg-white border-gray-200 text-gray-300 opacity-40"}`}>
                          ✗ Não
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          );
        })}

        {/* Comments */}
        {form.comments && (
          <Card shadow="md">
            <div className="flex flex-col gap-2">
              <Text variant="heading-sm" className="text-gray-400">Comentários</Text>
              <Text variant="body-md" className="text-gray-300">{form.comments}</Text>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
