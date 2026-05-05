import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trainingService, type TrainingResponse } from "@/services/training-service";
import type { TrainingSession, TrainingType } from "@/types";
import {
  EFICACIA_QUESTIONS,
  REACAO_QUESTIONS,
  EFICACIA_LABELS,
  REACAO_LABELS,
  EFICACIA_COLORS,
  REACAO_COLORS,
} from "./session-constants";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgScore(answers: { questionId: string; value: number }[], count: number): number {
  const scores = answers
    .filter((a) => a.questionId !== "nps" && a.value > 0)
    .slice(0, count)
    .map((a) => a.value);
  if (scores.length === 0) return 0;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function avgColor(avg: number, max: number) {
  const pct = avg / max;
  if (pct >= 0.75) return "bg-green-base/10 text-green-base border border-green-base/30";
  if (pct >= 0.5) return "bg-yellow-50 text-yellow-600 border border-yellow-300";
  return "bg-red-base/10 text-red-base border border-red-base/30";
}

function npsColor(v: number) {
  if (v >= 9) return "bg-green-base/10 text-green-base border border-green-base/30";
  if (v >= 7) return "bg-yellow-50 text-yellow-600 border border-yellow-300";
  return "bg-red-base/10 text-red-base border border-red-base/30";
}

function questionAvgColor(avg: number, max: number) {
  const pct = avg / max;
  if (pct >= 0.75) return { barColor: "#52a350", badge: "bg-green-base/10 text-green-base border border-green-base/30" };
  if (pct >= 0.5)  return { barColor: "#facc15", badge: "bg-yellow-50 text-yellow-600 border border-yellow-300" };
  return { barColor: "#e74c3c", badge: "bg-red-base/10 text-red-base border border-red-base/30" };
}

// ─── Single response row ──────────────────────────────────────────────────────

function ResponseRow({
  response,
  trainingType,
}: {
  response: TrainingResponse;
  trainingType: TrainingType;
}) {
  const [expanded, setExpanded] = useState(false);

  const questions = trainingType === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
  const labels = trainingType === "eficacia" ? EFICACIA_LABELS : REACAO_LABELS;
  const colors = trainingType === "eficacia" ? EFICACIA_COLORS : REACAO_COLORS;
  const scaleMax = trainingType === "eficacia" ? 3 : 5;

  const answerMap = new Map(response.answers.map((a) => [a.questionId, a.value]));
  const nps = answerMap.get("nps");
  const avg = avgScore(response.answers, questions.length);

  return (
    <div
      className={`rounded-xl border cursor-pointer transition-all duration-150 ${
        expanded ? "border-teal-base/50 shadow-md" : "border-gray-100 hover:border-teal-base/30 shadow-sm"
      } bg-white`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <Text variant="body-sm-bold" className="text-gray-400 flex-1 min-w-30">
          {response.respondentName || "Anônimo"}
        </Text>

        {avg > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${avgColor(avg, scaleMax)}`}>
            Média {avg.toFixed(1)}/{scaleMax}
          </span>
        )}

        {trainingType === "reacao" && nps != null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${npsColor(nps)}`}>
            Nota {nps}/10
          </span>
        )}

        {trainingType === "reacao" && response.recomenda != null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
              response.recomenda
                ? "bg-green-base/10 text-green-base border-green-base/30"
                : "bg-red-base/10 text-red-base border-red-base/30"
            }`}
          >
            {response.recomenda ? "Recomenda" : "Não recomenda"}
          </span>
        )}

        <Text variant="caption" className="text-gray-300 shrink-0 ml-auto">
          {new Date(response.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })}
        </Text>

        <span className={`text-gray-300 text-xs transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </div>

      {expanded && (
        <div
          className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {questions.map((q, i) => {
            const qid = `q${i + 1}`;
            const val = answerMap.get(qid);
            return (
              <div key={qid} className="flex items-start gap-3">
                <span className="text-xs text-gray-300 shrink-0 w-4 text-right mt-0.5">{i + 1}.</span>
                <p className="text-xs text-gray-300 flex-1">{q}</p>
                {val != null && val > 0 ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${colors[val] ?? ""}`}>
                    {labels[val] ?? val}
                  </span>
                ) : (
                  <span className="text-xs text-gray-200 shrink-0">—</span>
                )}
              </div>
            );
          })}

          {trainingType === "reacao" && nps != null && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-300 shrink-0 w-4 text-right">★</span>
              <p className="text-xs text-gray-300 flex-1">Nota geral (0–10)</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${npsColor(nps)}`}>{nps}</span>
            </div>
          )}

          {(response.pontoAlto || response.jaAplica || response.recomenda != null || response.recomendaMotivo || response.comments) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 mt-1">
              {response.pontoAlto && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">Ponto alto:</p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.pontoAlto}</p>
                </div>
              )}
              {response.jaAplica && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">Já aplica:</p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.jaAplica}</p>
                </div>
              )}
              {response.recomenda != null && response.recomendaMotivo && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">Motivo:</p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.recomendaMotivo}</p>
                </div>
              )}
              {response.comments && (
                <div>
                  <p className="text-xs font-semibold text-gray-300">
                    {trainingType === "eficacia" ? "Observações:" : "Comentários:"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{response.comments}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Question analytics ───────────────────────────────────────────────────────

function QuestionAnalytics({
  responses,
  trainingType,
}: {
  responses: TrainingResponse[];
  trainingType: TrainingType;
}) {
  const questions = trainingType === "eficacia" ? EFICACIA_QUESTIONS : REACAO_QUESTIONS;
  const scaleMax = trainingType === "eficacia" ? 3 : 5;

  const questionStats = questions.map((text, i) => {
    const qid = `q${i + 1}`;
    const values = responses
      .map((r) => r.answers.find((a) => a.questionId === qid)?.value)
      .filter((v): v is number => v != null && v > 0);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    return { qid, text, avg, count: values.length };
  }).filter((q) => q.count > 0).sort((a, b) => a.avg - b.avg);

  if (questionStats.length === 0) return null;

  return (
    <Card shadow="sm" className="flex flex-col gap-4">
      <div>
        <Text variant="body-sm-bold" className="text-gray-400">Análise por Pergunta</Text>
        <Text variant="caption" className="text-gray-300">
          Ordenado da nota mais baixa para mais alta · escala 1–{scaleMax}
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        {questionStats.map((q) => {
          const { barColor, badge } = questionAvgColor(q.avg, scaleMax);
          const pct = (q.avg / scaleMax) * 100;
          return (
            <div key={q.qid} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-gray-300 flex-1 leading-relaxed">{q.text}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 border ${badge}`}>
                  {q.avg.toFixed(1)}/{scaleMax}
                </span>
              </div>
              <div className="relative w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#e5e7eb" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Responses panel ──────────────────────────────────────────────────────────

export function ResponsesPanel({
  tenantSlug,
  session,
  onClose,
}: {
  tenantSlug: string;
  session: TrainingSession;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["training-responses", tenantSlug, session.slug],
    queryFn: () => trainingService.getResponses(tenantSlug, { session: session.slug }),
  });

  const allResponses = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="heading-sm" className="text-gray-400">
            Respostas — {session.title}
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            {session.trainingDate} · {session.instructor}
          </Text>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          ✕ Fechar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allResponses.length === 0 ? (
        <Card shadow="sm">
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <span className="text-4xl">📭</span>
            <Text variant="body-md" className="text-gray-300">
              Nenhuma resposta registrada para este treinamento ainda.
            </Text>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <QuestionAnalytics responses={allResponses} trainingType={session.trainingType} />
          <Text variant="caption" className="text-gray-300">
            {allResponses.length} {allResponses.length === 1 ? "resposta" : "respostas"}
          </Text>
          {allResponses.map((r) => (
            <ResponseRow key={r.id} response={r} trainingType={session.trainingType} />
          ))}
        </div>
      )}
    </div>
  );
}
