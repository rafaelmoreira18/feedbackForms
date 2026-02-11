import { useParams, useNavigate } from "react-router-dom";
import { formService } from "../services/form-service";
import type { SatisfactionRatings, ExperienceAnswers } from "../types";
import { formatDate, formatRating } from "../utils/format";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";

const satisfactionLabels: Record<keyof SatisfactionRatings, string> = {
  overallCare: "Como você avalia o atendimento geral recebido no hospital?",
  nursingCare: "Como você avalia o atendimento da equipe de enfermagem?",
  medicalCare: "Como você avalia o atendimento da equipe médica?",
  welcoming: "Você se sentiu acolhido(a) durante sua internação?",
  cleanliness: "Como você avalia a limpeza e organização do ambiente?",
  comfort: "Como você avalia o conforto do quarto/leito?",
  responseTime: "Como você avalia o tempo de resposta às suas solicitações?",
  wouldRecommend: "Você indicaria este hospital para amigos ou familiares?",
  overallSatisfaction: "De forma geral, qual seu nível de satisfação com o hospital?",
};

const experienceLabels: Record<keyof ExperienceAnswers, string> = {
  professionalsIdentified: "Os profissionais se identificaram antes de realizar os atendimentos?",
  nameVerified: "Seu nome foi conferido antes da administração de medicamentos ou procedimentos?",
  treatmentExplained: "Você recebeu explicações claras sobre seu tratamento?",
  participatedInDecisions: "Você participou das decisões relacionadas ao seu cuidado?",
  medicationInstructionsClear: "As orientações sobre medicamentos foram claras e compreensíveis?",
  dischargeOrientationComplete: "Você recebeu orientações completas no momento da alta hospitalar?",
  knewWhoToAsk: "Você soube a quem recorrer quando teve dúvidas durante a internação?",
  privacyRespected: "Os profissionais respeitaram sua privacidade durante os atendimentos?",
};

const ratingLabels: Record<number, string> = {
  1: "Muito Ruim",
  2: "Ruim",
  3: "Bom",
  4: "Muito Bom",
  5: "Excelente",
};

export default function FormPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const form = id ? formService.getById(id) : undefined;

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center" shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-md" className="text-gray-400">
              Formulário não encontrado
            </Text>
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const avg = formService.getAverageSatisfaction(form);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2">
          <Text as="h1" variant="heading-md" className="text-gray-400">
            Respostas do Paciente
          </Text>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>

        {/* Patient Info */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">
              Informações do Paciente
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Nome" value={form.patientName} />
              <InfoItem label="CPF" value={
                form.patientCpf
                  ? form.patientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                  : "—"
              } />
              <InfoItem label="Idade" value={`${form.patientAge} anos`} />
              <InfoItem label="Gênero" value={form.patientGender} />
              <InfoItem label="Departamento Avaliado" value={form.evaluatedDepartment} />
              <InfoItem label="Data de Admissão" value={formatDate(form.admissionDate)} />
              <InfoItem label="Data de Alta" value={formatDate(form.dischargeDate)} />
              <InfoItem label="Data da Resposta" value={formatDate(form.createdAt)} />
              <InfoItem
                label="Média Geral"
                value={formatRating(Math.round(avg * 10) / 10)}
              />
            </div>
          </div>
        </Card>

        {/* Form 1: Satisfaction */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">
              1. Pesquisa de Satisfação do Paciente
            </Text>
            <div className="flex flex-col gap-3">
              {(Object.keys(satisfactionLabels) as (keyof SatisfactionRatings)[]).map(
                (key) => (
                  <div key={key} className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0">
                    <Text variant="body-sm" className="text-gray-300">
                      {satisfactionLabels[key]}
                    </Text>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div
                            key={rating}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-xs sm:text-sm font-semibold ${
                              form.satisfaction[key] >= rating
                                ? "bg-blue-base text-white"
                                : "bg-gray-200 text-gray-300"
                            }`}
                          >
                            {rating}
                          </div>
                        ))}
                      </div>
                      <Text variant="body-sm-bold" className="text-gray-400">
                        {ratingLabels[form.satisfaction[key]]}
                      </Text>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </Card>

        {/* Form 2: Experience */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">
              2. Pesquisa de Experiência do Paciente
            </Text>
            <div className="flex flex-col gap-3">
              {(Object.keys(experienceLabels) as (keyof ExperienceAnswers)[]).map(
                (key) => (
                  <div key={key} className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0">
                    <Text variant="body-sm" className="text-gray-300">
                      {experienceLabels[key]}
                    </Text>
                    <Text
                      variant="body-md-bold"
                      className={form.experience[key] ? "text-green-base" : "text-red-base"}
                    >
                      {form.experience[key] ? "Sim" : "Não"}
                    </Text>
                  </div>
                )
              )}
            </div>
          </div>
        </Card>

        {/* Comments */}
        {form.comments && (
          <Card shadow="md">
            <div className="flex flex-col gap-2">
              <Text variant="heading-sm" className="text-gray-400">
                Comentários
              </Text>
              <Text variant="body-md" className="text-gray-300">
                {form.comments}
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="body-sm" className="text-gray-300">
        {label}
      </Text>
      <Text variant="body-md-bold" className="text-gray-400">
        {value}
      </Text>
    </div>
  );
}