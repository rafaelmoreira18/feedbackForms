import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { form3Service } from "@/services/form3-service";
import { tenantService } from "@/services/tenant-service";
import type { Form3Answer, FormTemplate, Tenant, CpfJustificativa } from "@/types";

export interface PatientInfo {
  patientName: string;
  patientCpf: string;
  patientAge: string;
  patientGender: "Masculino" | "Feminino" | "Outro";
  admissionDate: string;
  dischargeDate: string;
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

export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function useForm3() {
  const { tenantSlug = "", formSlug = "" } = useParams<{ tenantSlug: string; formSlug: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [cpfError, setCpfError] = useState("");
  const [dateError, setDateError] = useState("");
  const [cpfOmitido, setCpfOmitido] = useState(false);
  const [cpfJustificativa, setCpfJustificativa] = useState<CpfJustificativa | "">("");
  const [recusouResponder, setRecusouResponder] = useState(false);
  const [unansweredKeys, setUnansweredKeys] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState("");

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    patientName: "",
    patientCpf: "",
    patientAge: "",
    patientGender: "Masculino",
    admissionDate: "",
    dischargeDate: "",
  });

  const [answers, setAnswers] = useState<Map<string, Form3Answer>>(new Map());

  useEffect(() => {
    if (!tenantSlug || !formSlug) { setNotFound(true); setLoading(false); return; }

    Promise.all([
      tenantService.getBySlug(tenantSlug),
      tenantService.getFormTemplate(tenantSlug, formSlug),
    ])
      .then(([tn, tmpl]) => {
        setTenant(tn);
        setTemplate(tmpl);
        const map = new Map<string, Form3Answer>();
        tmpl.blocks.forEach((block) => {
          block.questions.forEach((q) => {
            map.set(q.questionKey, { questionId: q.questionKey, value: q.scale === "nps" ? -1 : 0 });
          });
        });
        setAnswers(map);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tenantSlug, formSlug]);

  function setAnswer(questionKey: string, value: number) {
    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = prev.get(questionKey);
      next.set(questionKey, value >= 3 ? { questionId: questionKey, value } : { ...existing, questionId: questionKey, value });
      return next;
    });
    if (value > 0) {
      setUnansweredKeys((prev) => { const next = new Set(prev); next.delete(questionKey); return next; });
    }
  }

  function setAnswerReasons(questionKey: string, reasons: string[]) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionKey, { ...prev.get(questionKey)!, reasons });
      return next;
    });
  }

  function setAnswerNote(questionKey: string, note: string) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionKey, { ...prev.get(questionKey)!, note });
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    let valid = true;

    if (cpfOmitido) {
      if (!cpfJustificativa) {
        setCpfError("Selecione o motivo para não informar o CPF");
        valid = false;
      } else {
        setCpfError("");
      }
    } else {
      if (!isValidCpf(patientInfo.patientCpf)) { setCpfError("CPF inválido"); valid = false; } else setCpfError("");
    }

    if (patientInfo.admissionDate && patientInfo.dischargeDate && patientInfo.dischargeDate < patientInfo.admissionDate) {
      setDateError("A data de alta não pode ser anterior à data de admissão"); valid = false;
    } else setDateError("");

    if (!recusouResponder && template) {
      const missing = new Set<string>();
      template.blocks.forEach((block) => {
        block.questions.forEach((q) => {
          if (q.scale === "rating4" && (answers.get(q.questionKey)?.value ?? 0) === 0) {
            missing.add(q.questionKey);
          }
        });
      });
      if (missing.size > 0) {
        setUnansweredKeys(missing);
        toast.error("Por favor, responda todas as perguntas antes de enviar.");
        valid = false;
      }
    }

    if (!valid || !template) {
      submittingRef.current = false;
      return;
    }

    const answersArray = recusouResponder
      ? []
      : template.blocks.flatMap((block) =>
          block.questions.map((q) => answers.get(q.questionKey) ?? { questionId: q.questionKey, value: q.scale === "nps" ? 0 : 1 })
        );

    setSubmitting(true);
    try {
      await form3Service.create(tenantSlug, {
        formType: formSlug,
        ...patientInfo,
        patientCpf: cpfOmitido ? null : patientInfo.patientCpf.replace(/\D/g, ""),
        ...(cpfOmitido && cpfJustificativa ? { cpfJustificativa: cpfJustificativa as CpfJustificativa } : {}),
        patientAge: parseInt(patientInfo.patientAge),
        evaluatedDepartment: template.name,
        answers: answersArray,
        comments: recusouResponder ? "" : comments,
        recusouResponder,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(`Erro ao enviar pesquisa: ${(err as Error).message}`);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return {
    tenant,
    tenantSlug,
    template,
    loading,
    notFound,
    submitted,
    submitting,
    cpfError,
    dateError,
    unansweredKeys,
    patientInfo,
    setPatientInfo,
    answers,
    setAnswer,
    setAnswerReasons,
    setAnswerNote,
    comments,
    setComments,
    setCpfError,
    setDateError,
    cpfOmitido,
    setCpfOmitido,
    cpfJustificativa,
    setCpfJustificativa,
    recusouResponder,
    setRecusouResponder,
    handleSubmit,
    navigate,
  };
}
