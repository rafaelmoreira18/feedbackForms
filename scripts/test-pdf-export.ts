/**
 * Smoke test for PDF report generators.
 * Generates real PDFs to /tmp/pdf-test/ with several scenarios and
 * validates: magic header, non-empty, page count, expected text presence.
 *
 * Run: pnpm tsx scripts/test-pdf-export.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { jsPDF } from "jspdf";
import { generateTrainingReport } from "../src/services/training-report.service";
import { generatePesquisaCorporativaReport } from "../src/services/pesquisa-corporativa-report.service";
import type {
  TrainingSession,
  PesquisaCorporativa,
  PesquisaResposta,
  PesquisaMetricas,
} from "../src/types";
import type {
  TrainingResponse,
  TrainingMetrics,
} from "../src/services/training-service";

const OUT_DIR = "/tmp/pdf-test";
mkdirSync(OUT_DIR, { recursive: true });

// ─── Capture doc.save() calls instead of writing via FileSaver ────────────────

const captured: { name: string; bytes: Uint8Array }[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(jsPDF as any).API.save = function (filename: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ab = (this as any).output("arraybuffer") as ArrayBuffer;
  captured.push({ name: filename, bytes: new Uint8Array(ab) });
  return this;
};

// ─── Mock data factories ──────────────────────────────────────────────────────

function reacaoResponse(idx: number, overrides: Partial<TrainingResponse> = {}): TrainingResponse {
  return {
    id: `r${idx}`,
    tenantId: "t",
    sessionId: "s",
    respondentName: `Colaborador ${idx}`,
    answers: [
      { questionId: "q1", value: 5 },
      { questionId: "q2", value: 4 },
      { questionId: "q3", value: 3 },
      { questionId: "q4", value: 5 },
      { questionId: "q5", value: 4 },
      { questionId: "q6", value: 5 },
      { questionId: "q7", value: 4 },
      { questionId: "q8", value: 3 },
      { questionId: "q9", value: 5 },
      { questionId: "q10", value: 5 },
      { questionId: "nps", value: 9 },
    ],
    pontoAlto: "Conteúdo muito didático e exemplos práticos",
    jaAplica: "Sim, já comecei a aplicar com a equipe",
    recomenda: true,
    recomendaMotivo: "Treinamento agregou muito ao trabalho",
    comments: "Sugiro mais dinâmicas em grupo",
    createdAt: new Date(2026, 4, 15 - idx).toISOString(),
    ...overrides,
  };
}

function eficaciaResponse(idx: number): TrainingResponse {
  return {
    id: `e${idx}`,
    tenantId: "t",
    sessionId: "s2",
    respondentName: `Gestor ${idx}`,
    answers: Array.from({ length: 7 }, (_, i) => ({
      questionId: `q${i + 1}`,
      value: ((idx + i) % 3) + 1,
    })),
    pontoAlto: "",
    jaAplica: "",
    recomenda: null,
    recomendaMotivo: "",
    comments: "Observação de eficácia: equipe absorveu bem o conteúdo",
    createdAt: new Date(2026, 4, 10 - idx).toISOString(),
  };
}

function reacaoSession(): TrainingSession {
  return {
    id: "s1", tenantId: "t", slug: "treinamento-integracao",
    title: "Integração de Novos Colaboradores",
    trainingDate: "2026-05-15", trainingType: "reacao",
    instructor: "Ana Souza", active: true,
    createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
  } as TrainingSession;
}
function eficaciaSession(): TrainingSession {
  return { ...reacaoSession(), slug: "eficacia-integracao", title: "Eficácia — Integração", trainingType: "eficacia" } as TrainingSession;
}

function reacaoMetrics(): TrainingMetrics {
  return { totalResponses: 12, averageSatisfaction: 4.3, responsesThisMonth: 8, responsesLastMonth: 4, averageNps: 78 };
}
function eficaciaMetrics(): TrainingMetrics {
  return { totalResponses: 5, averageSatisfaction: 2.4, responsesThisMonth: 5, responsesLastMonth: 0, averageNps: 0 };
}

function pesquisaCorp(): PesquisaCorporativa {
  return {
    id: "p1", tenantId: "t", slug: "clima-2026-s1",
    titulo: "Pesquisa de Clima 2026 — 1º Semestre",
    tipo: "Clima Organizacional", ativa: true,
    periodo: "1º semestre 2026", categoria: "Satisfação",
    visibility: "global", allowedTenantIds: null,
    criadoEm: "2026-04-01T00:00:00Z",
    blocos: [
      {
        id: "b1", titulo: "Ambiente de trabalho", ordem: 1, perguntas: [
          { id: "p1", texto: "Como avalia o ambiente físico?", escala: "likert5", obrigatoria: true, ordem: 1 },
          { id: "p2", texto: "A comunicação com a liderança é clara?", escala: "likert5", obrigatoria: true, ordem: 2 },
          { id: "p3", texto: "Sugestões de melhoria", escala: "aberta", obrigatoria: false, ordem: 3 },
        ],
      },
      {
        id: "b2", titulo: "Fornecedor", ordem: 2, perguntas: [
          { id: "p4", texto: "Indicaria nosso fornecedor a outros?", escala: "booleano", obrigatoria: true, ordem: 1 },
        ],
      },
    ],
  };
}

function pesquisaRespostas(): PesquisaResposta[] {
  return [
    {
      id: "r1", tenantId: "t", pesquisaId: "p1",
      nomeRespondente: "João Silva",
      metadados: { fornecedor: "Fornecedor ABC Ltda", tempoDeEmpresa: "3-5 anos" },
      answers: [
        { perguntaId: "p1", valor: 4 },
        { perguntaId: "p2", valor: 5 },
        { perguntaId: "p3", valor: "Mais espaço de descompressão no andar 3" },
        { perguntaId: "p4", valor: true },
      ],
      criadoEm: "2026-05-10T10:00:00Z",
    },
    {
      id: "r2", tenantId: "t", pesquisaId: "p1",
      nomeRespondente: "Maria Costa",
      metadados: { tempoDeEmpresa: "menos de 1 ano" },
      answers: [
        { perguntaId: "p1", valor: 2 },
        { perguntaId: "p2", valor: 3 },
        { perguntaId: "p3", valor: "Iluminação fraca na área de café" },
        { perguntaId: "p4", valor: false },
      ],
      criadoEm: "2026-05-12T14:30:00Z",
    },
  ];
}

function pesquisaMetricas(empty = false): PesquisaMetricas {
  if (empty) return { total: 0, mediaGeral: null, porPergunta: {} };
  return {
    total: 2,
    mediaGeral: 3.5,
    porPergunta: {
      p1: { media: 3.0, total: 2 },
      p2: { media: 4.0, total: 2 },
      p4: { media: 0.5, total: 2 },
    },
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

function pageCount(content: string): number {
  return (content.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

interface Check { name: string; pass: boolean; detail?: string }

function validate(label: string, bytes: Uint8Array, mustContain: string[]): Check[] {
  const content = bytesToString(bytes);
  const checks: Check[] = [];
  checks.push({ name: "PDF magic header", pass: content.startsWith("%PDF-") });
  checks.push({ name: "non-empty (>2KB)", pass: bytes.byteLength > 2048, detail: `${bytes.byteLength} bytes` });
  checks.push({ name: "has at least 1 page", pass: pageCount(content) >= 1, detail: `${pageCount(content)} pages` });
  mustContain.forEach((needle) => {
    checks.push({ name: `contains "${needle}"`, pass: content.includes(needle) });
  });
  console.log(`\n── ${label} ──`);
  checks.forEach((c) => {
    const sym = c.pass ? "✓" : "✗";
    console.log(`  ${sym} ${c.name}${c.detail ? `  (${c.detail})` : ""}`);
  });
  return checks;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

console.log("Generating PDFs to", OUT_DIR);

// 1) Training Reação — full data
captured.length = 0;
generateTrainingReport(
  reacaoSession(),
  reacaoMetrics(),
  Array.from({ length: 12 }, (_, i) => reacaoResponse(i + 1)),
);
const reacaoFull = captured[0];
writeFileSync(`${OUT_DIR}/${reacaoFull.name}`, reacaoFull.bytes);

// 2) Training Eficácia — typical
captured.length = 0;
generateTrainingReport(
  eficaciaSession(),
  eficaciaMetrics(),
  Array.from({ length: 5 }, (_, i) => eficaciaResponse(i + 1)),
);
const eficaciaFull = captured[0];
writeFileSync(`${OUT_DIR}/${eficaciaFull.name}`, eficaciaFull.bytes);

// 3) Training — empty responses
captured.length = 0;
generateTrainingReport(reacaoSession(), { ...reacaoMetrics(), totalResponses: 0, responsesThisMonth: 0, responsesLastMonth: 0 }, []);
const trainingEmpty = captured[0];
writeFileSync(`${OUT_DIR}/empty-${trainingEmpty.name}`, trainingEmpty.bytes);

// 4) Training — Reacao but response missing nps/recomenda/text fields
captured.length = 0;
generateTrainingReport(reacaoSession(), reacaoMetrics(), [
  reacaoResponse(99, { pontoAlto: "", jaAplica: "", recomenda: null, recomendaMotivo: "", comments: "", respondentName: "" }),
]);
const reacaoMin = captured[0];
writeFileSync(`${OUT_DIR}/min-${reacaoMin.name}`, reacaoMin.bytes);

// 5) Pesquisa Corporativa — typical
captured.length = 0;
generatePesquisaCorporativaReport(pesquisaCorp(), pesquisaMetricas(), pesquisaRespostas());
const pcFull = captured[0];
writeFileSync(`${OUT_DIR}/${pcFull.name}`, pcFull.bytes);

// 6) Pesquisa Corporativa — empty
captured.length = 0;
generatePesquisaCorporativaReport(pesquisaCorp(), pesquisaMetricas(true), []);
const pcEmpty = captured[0];
writeFileSync(`${OUT_DIR}/empty-${pcEmpty.name}`, pcEmpty.bytes);

// ─── Run validations ──────────────────────────────────────────────────────────

const all: Check[] = [];

all.push(...validate("Training Reação (full, 12 respostas)", reacaoFull.bytes, [
  "Integracao de Novos Colaboradores",
  "Ana Souza",
  "Reacao",
  "Recomendariam",
  "78%",
  "Total de Respostas",
  "Media Satisfacao",
  "Recomenda",
  "Nota 9/10",
  "Ponto alto",
]));

all.push(...validate("Training Eficácia (5 respostas)", eficaciaFull.bytes, [
  "Eficacia",
  "Ana Souza",
  "Analise por Pergunta",
  "Observacoes",
]));

all.push(...validate("Training (sem respostas)", trainingEmpty.bytes, [
  "Integracao de Novos Colaboradores",
  "Total de Respostas",
]));

all.push(...validate("Training (Reação resposta mínima)", reacaoMin.bytes, [
  "Anonimo",
]));

all.push(...validate("Pesquisa Corporativa (likert + aberta + booleano)", pcFull.bytes, [
  "Pesquisa de Clima 2026",
  "Clima Organizacional",
  "Satisfacao",
  "Media Geral",
  // João tem metadados.fornecedor → título da linha vira o fornecedor (não o nome) — mesmo
  // comportamento da página de respostas (pesquisa-respostas.tsx:89).
  "Fornecedor ABC Ltda",
  // Maria não tem fornecedor → mostra o nomeRespondente.
  "Maria Costa",
  "Muito satisfeito",
  "Sim",
  "Nao",
  "ambiente",
  // Resposta aberta deve aparecer no corpo do PDF
  "espaco de descompressao",
  "Iluminacao fraca",
]));

all.push(...validate("Pesquisa Corporativa (sem respostas)", pcEmpty.bytes, [
  "Pesquisa de Clima 2026",
  "Total de Respostas",
]));

const failed = all.filter((c) => !c.pass);
console.log("\n─────────────────────────");
console.log(`Total: ${all.length}, Pass: ${all.length - failed.length}, Fail: ${failed.length}`);
if (failed.length > 0) {
  console.log("\nFailures:");
  failed.forEach((c) => console.log(`  ✗ ${c.name}${c.detail ? `  (${c.detail})` : ""}`));
  process.exit(1);
}

console.log("\nAll PDFs written to", OUT_DIR);
