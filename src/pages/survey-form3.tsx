import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm3, formatCpf } from "../hooks/useForm3";
import Input from "../components/input";
import Textarea from "../components/textarea";
import Button from "../components/button";
import DateInput from "../components/date-input";
import Rating4Input from "../components/form3/rating4-input";
import NpsInput from "../components/form3/nps-input";
import SectionHeader from "../components/form3/section-header";
import { ROUTES } from "../routes";

export default function SurveyForm3() {
  const {
    tenantSlug,
    template,
    loading,
    notFound,
    submitted,
    cpfError,
    dateError,
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
    handleSubmit,
  } = useForm3();

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-sm w-full">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-400 font-sans mb-2">Setor não encontrado</h2>
          <Button onClick={() => navigate(ROUTES.pesquisa(tenantSlug))} className="mt-4">Voltar aos setores</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <SubmittedScreen tenantSlug={tenantSlug} />;
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 font-sans">{template.name}</h1>
          <p className="text-gray-300 font-sans mt-1 text-sm sm:text-base">
            Pesquisa de Satisfação &amp; Experiência do Paciente
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-teal-base via-teal-dark to-blue-dark" />

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-8">

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
                      <button key={g} type="button" onClick={() => setPatientInfo({ ...patientInfo, patientGender: g })}
                        className={`flex-1 text-sm font-semibold font-sans transition-all duration-150 ${patientInfo.patientGender === g ? "bg-teal-base text-white" : "bg-white text-gray-300 hover:bg-teal-light/30"}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateInput label="Data de Admissão" value={patientInfo.admissionDate} required
                  onChange={(v) => {
                    const next = { ...patientInfo, admissionDate: v };
                    if (patientInfo.dischargeDate && v && patientInfo.dischargeDate < v) next.dischargeDate = "";
                    if (dateError) setDateError("");
                    setPatientInfo(next);
                  }} />
                <DateInput label="Data de Alta / Atendimento" value={patientInfo.dischargeDate} required
                  minDate={patientInfo.admissionDate || undefined} error={dateError}
                  onChange={(v) => { setPatientInfo({ ...patientInfo, dischargeDate: v }); if (dateError) setDateError(""); }} />
              </div>
            </section>

            {template.blocks.map((block) => (
              <section key={block.id} className="flex flex-col gap-4">
                <SectionHeader icon="📋" title={block.title} />
                {block.questions.map((question) =>
                  question.scale === "rating4" ? (
                    <Rating4Input
                      key={question.id}
                      label={question.text}
                      value={answers.get(question.questionKey)?.value ?? 0}
                      onChange={(v) => setAnswer(question.questionKey, v)}
                      subReasons={question.subReasons}
                      selectedReasons={answers.get(question.questionKey)?.reasons ?? []}
                      note={answers.get(question.questionKey)?.note ?? ""}
                      onReasonsChange={(r) => setAnswerReasons(question.questionKey, r)}
                      onNoteChange={(n) => setAnswerNote(question.questionKey, n)}
                    />
                  ) : (
                    <NpsInput
                      key={question.id}
                      label={question.text}
                      value={answers.get(question.questionKey)?.value === -1 ? null : (answers.get(question.questionKey)?.value ?? null)}
                      onChange={(v) => setAnswer(question.questionKey, v)}
                    />
                  )
                )}
              </section>
            ))}

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

        <p className="text-center text-xs text-gray-300 font-sans mt-4 pb-2">
          Hospital Regional de Guajará-Mirim
        </p>
      </div>
    </div>
  );
}

function SubmittedScreen({ tenantSlug }: { tenantSlug: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate(ROUTES.pesquisa(tenantSlug), { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [tenantSlug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="text-center flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-green-base border-4 border-green-base flex items-center justify-center">
          <span className="text-4xl text-white">✓</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-400 font-sans">Enviado!</h2>
          <p className="text-gray-300 font-sans mt-2">Pesquisa registrada com sucesso.</p>
          <p className="text-gray-300 font-sans text-sm mt-1">Voltando para os setores em instantes...</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.pesquisa(tenantSlug), { replace: true })}>
          Novo paciente agora
        </Button>
      </div>
    </div>
  );
}
