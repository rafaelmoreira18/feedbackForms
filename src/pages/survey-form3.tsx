import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { form3Service } from "../services/form3-service";
import { FORM3_CONFIGS, FORM3_SLUG_TO_TYPE, RATING4_LABELS } from "./survey-form3-config";
import type { Form3Answer } from "../types";
import Input from "../components/input";
import Textarea from "../components/textarea";
import Button from "../components/button";
import DateInput from "../components/date-input";
import SubReasonPanel from "../components/sub-reason-panel";

// ─── Rating 4 config ──────────────────────────────────────────────────────────

const NOTO_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";
const RATING4_EMOJI_URLS: Record<number, string> = {
  1: `${NOTO_BASE}/1f614/512.webp`,
  2: `${NOTO_BASE}/1f610/512.webp`,
  3: `${NOTO_BASE}/1f642/512.webp`,
  4: `${NOTO_BASE}/1f601/512.webp`,
};

const RATING4_STYLES: Record<number, { active: string; inactive: string }> = {
  1: { active: "bg-red-base border-red-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base" },
  2: { active: "bg-yellow-base border-yellow-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base" },
  3: { active: "bg-teal-base border-teal-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base" },
  4: { active: "bg-green-base border-green-base text-white shadow-md", inactive: "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base" },
};

const ANIM = `
@keyframes popIn {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.emoji-pop { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b-2 border-teal-light">
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-base to-teal-dark flex items-center justify-center text-xl shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-400 font-sans">{title}</h2>
        {subtitle && <p className="text-xs text-gray-300 font-sans mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Rating4Input({
  label,
  value,
  onChange,
  subReasons,
  selectedReasons,
  note,
  onReasonsChange,
  onNoteChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  subReasons?: [string, string, string];
  selectedReasons: string[];
  note: string;
  onReasonsChange: (reasons: string[]) => void;
  onNoteChange: (note: string) => void;
}) {
  return (
    <>
      <style>{ANIM}</style>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-400 font-sans">{label}</p>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {[1, 2, 3, 4].map((r) => {
            const isActive = value === r;
            return (
              <button
                key={r}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(value === r ? 0 : r)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150 w-full sm:w-auto ${isActive ? RATING4_STYLES[r].active : RATING4_STYLES[r].inactive}`}
              >
                {isActive && (
                  <img
                    key={`${r}-active`}
                    src={RATING4_EMOJI_URLS[r]}
                    alt={RATING4_LABELS[r]}
                    width={24}
                    height={24}
                    className="emoji-pop shrink-0"
                  />
                )}
                <span>{RATING4_LABELS[r]}</span>
              </button>
            );
          })}
        </div>
        {value > 0 && value <= 2 && subReasons && (
          <SubReasonPanel
            reasons={subReasons}
            selectedReasons={selectedReasons}
            note={note}
            rating={value as 1 | 2}
            onReasonsChange={onReasonsChange}
            onNoteChange={onNoteChange}
          />
        )}
      </div>
    </>
  );
}

function NpsInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  function getColor(n: number): string {
    if (value !== n) return "bg-gray-100 text-gray-300 hover:bg-gray-200";
    if (n <= 6) return "bg-brand-red text-white";
    if (n <= 8) return "bg-yellow-base text-white";
    return "bg-green-base text-white";
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-400 font-sans">{label}</p>
      <div className="grid grid-cols-11 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(n)}
            className={`h-10 w-full rounded-lg font-bold text-sm transition-all duration-150 ${getColor(n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-300 font-sans">Muito improvável</span>
        <span className="text-xs text-gray-300 font-sans">Muito provável</span>
      </div>
    </div>
  );
}

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let c = 11 - (s % 11); if (c >= 10) c = 0;
  if (parseInt(d[9]) !== c) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  c = 11 - (s % 11); if (c >= 10) c = 0;
  return parseInt(d[10]) === c;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveyForm3() {
  const location = useLocation();
  const navigate = useNavigate();

  const slug = location.pathname.replace(/^\//, "");
  const formType = FORM3_SLUG_TO_TYPE[slug];
  const config = formType ? FORM3_CONFIGS[formType] : undefined;

  const [submitted, setSubmitted] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [dateError, setDateError] = useState("");

  const [patientInfo, setPatientInfo] = useState({
    patientName: "",
    patientCpf: "",
    patientAge: "",
    patientGender: "Masculino" as "Masculino" | "Feminino" | "Outro",
    admissionDate: "",
    dischargeDate: "",
  });

  const [answers, setAnswers] = useState<Map<string, Form3Answer>>(() => {
    const map = new Map<string, Form3Answer>();
    if (config) {
      config.blocks.forEach((block) => {
        block.questions.forEach((q) => {
          map.set(q.id, { questionId: q.id, value: q.scale === "nps" ? -1 : 0 });
        });
      });
    }
    return map;
  });

  const [comments, setComments] = useState("");

  if (!formType || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">Setor não encontrado</h2>
          <Button onClick={() => navigate("/")} className="mt-4">Voltar ao início</Button>
        </div>
      </div>
    );
  }

  function setAnswer(questionId: string, value: number) {
    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = prev.get(questionId);
      // Clear sub-reasons when rating improves to Bom or Excelente
      if (value >= 3) {
        next.set(questionId, { questionId, value });
      } else {
        next.set(questionId, { ...existing, questionId, value });
      }
      return next;
    });
  }

  function setAnswerReasons(questionId: string, reasons: string[]) {
    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = prev.get(questionId)!;
      next.set(questionId, { ...existing, reasons });
      return next;
    });
  }

  function setAnswerNote(questionId: string, note: string) {
    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = prev.get(questionId)!;
      next.set(questionId, { ...existing, note });
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;
    if (!isValidCpf(patientInfo.patientCpf)) { setCpfError("CPF inválido"); valid = false; } else setCpfError("");
    if (patientInfo.admissionDate && patientInfo.dischargeDate && patientInfo.dischargeDate < patientInfo.admissionDate) {
      setDateError("A data de alta não pode ser anterior à data de admissão"); valid = false;
    } else setDateError("");
    if (!valid) return;
    const answersArray = config.blocks.flatMap((block) =>
      block.questions.map((q) => answers.get(q.id) ?? { questionId: q.id, value: q.scale === "nps" ? 0 : 1 })
    );
    try {
      await form3Service.create({
        formType,
        ...patientInfo,
        patientCpf: patientInfo.patientCpf.replace(/\D/g, ""),
        patientAge: parseInt(patientInfo.patientAge),
        evaluatedDepartment: formType,
        answers: answersArray,
        comments,
      });
      setSubmitted(true);
      setTimeout(() => navigate(location.pathname), 3000);
    } catch { /* retry */ }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-base border-4 border-green-base flex items-center justify-center">
            <span className="text-4xl text-white">✓</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-400 font-sans">Obrigado!</h2>
            <p className="text-gray-300 font-sans mt-2">Sua pesquisa foi enviada com sucesso.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">{formType}</h1>
          <p className="text-gray-300 font-sans mt-1 text-sm sm:text-base">
            Pesquisa de Satisfação &amp; Experiência do Paciente
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-8">

            {/* Patient Info */}
            <section className="flex flex-col gap-4">
              <SectionHeader icon="👤" title="Informações do Paciente" />
              <Input label="Nome Completo" type="text" value={patientInfo.patientName}
                onChange={(e) => setPatientInfo({ ...patientInfo, patientName: e.target.value })} required />
              <Input label="CPF" type="text" inputMode="numeric" placeholder="000.000.000-00"
                value={patientInfo.patientCpf} error={cpfError}
                onChange={(e) => { setPatientInfo({ ...patientInfo, patientCpf: formatCpf(e.target.value) }); if (cpfError) setCpfError(""); }} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Idade" type="number" min="0" max="150" value={patientInfo.patientAge}
                  onChange={(e) => setPatientInfo({ ...patientInfo, patientAge: e.target.value })} required />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">Gênero</span>
                  <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden h-12.5">
                    {(["Masculino", "Feminino", "Outro"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPatientInfo({ ...patientInfo, patientGender: g })}
                        className={`flex-1 text-sm font-semibold font-sans transition-all duration-150 ${
                          patientInfo.patientGender === g
                            ? "bg-teal-base text-white"
                            : "bg-white text-gray-300 hover:bg-teal-light/30"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateInput
                  label="Data de Admissão"
                  value={patientInfo.admissionDate}
                  required
                  onChange={(v) => {
                    const next = { ...patientInfo, admissionDate: v };
                    // clear discharge if it would become before admission
                    if (patientInfo.dischargeDate && v && patientInfo.dischargeDate < v) next.dischargeDate = "";
                    if (dateError) setDateError("");
                    setPatientInfo(next);
                  }}
                />
                <DateInput
                  label="Data de Alta / Atendimento"
                  value={patientInfo.dischargeDate}
                  required
                  minDate={patientInfo.admissionDate || undefined}
                  error={dateError}
                  onChange={(v) => { setPatientInfo({ ...patientInfo, dischargeDate: v }); if (dateError) setDateError(""); }}
                />
              </div>
            </section>

            {/* Dynamic question blocks */}
            {config.blocks.map((block) => (
              <section key={block.title} className="flex flex-col gap-4">
                <SectionHeader icon="📋" title={block.title} />
                {block.questions.map((question) =>
                  question.scale === "rating4" ? (
                    <Rating4Input
                      key={question.id}
                      label={question.text}
                      value={answers.get(question.id)?.value ?? 0}
                      onChange={(v) => setAnswer(question.id, v)}
                      subReasons={question.subReasons}
                      selectedReasons={answers.get(question.id)?.reasons ?? []}
                      note={answers.get(question.id)?.note ?? ""}
                      onReasonsChange={(r) => setAnswerReasons(question.id, r)}
                      onNoteChange={(n) => setAnswerNote(question.id, n)}
                    />
                  ) : (
                    <NpsInput
                      key={question.id}
                      label={question.text}
                      value={answers.get(question.id)?.value === -1 ? null : (answers.get(question.id)?.value ?? null)}
                      onChange={(v) => setAnswer(question.id, v)}
                    />
                  )
                )}
              </section>
            ))}

            {/* Comments */}
            <section className="flex flex-col gap-3">
              <SectionHeader icon="📝" title="Comentários Adicionais" subtitle="Opcional" />
              <Textarea placeholder="Deixe aqui seus comentários, sugestões ou críticas..."
                value={comments} onChange={(e) => setComments(e.target.value)} />
            </section>

            <Button type="submit" size="lg" className="w-full text-base font-bold tracking-wide">
              Enviar Pesquisa →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
