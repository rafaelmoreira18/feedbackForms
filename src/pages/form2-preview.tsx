import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { form2Service } from "../services/form2-service";
import type { Form2Response, InfrastructureRatings, PatientSafetyAnswers } from "../types";
import { formatDate, formatRating } from "../utils/format";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";

const infrastructureLabels: Record<keyof InfrastructureRatings, string> = {
  hospitalOverallInfrastructure:
    "Como você avalia a infraestrutura geral do hospital (ambientes, conservação e organização)?",
  commonAreasAdequacy:
    "Como você avalia a adequação das áreas comuns para circulação e permanência?",
  equipmentSafety:
    "Como você avalia a segurança transmitida pelos equipamentos utilizados no seu atendimento?",
  equipmentCondition:
    "Como você avalia o estado de conservação dos equipamentos?",
  bedComfort:
    "Como você avalia o conforto do leito/quarto?",
  accommodationNeeds:
    "Como você avalia o atendimento da acomodação às suas necessidades durante a internação?",
  mealQuality:
    "Como você avalia a qualidade das refeições oferecidas?",
  mealTimeliness:
    "Como você avalia a pontualidade na entrega das refeições?",
  nutritionTeamCare:
    "Como você avalia o atendimento da equipe de nutrição às suas necessidades alimentares?",
  hospitalSignage:
    "Como você avalia a sinalização do hospital para sua localização?",
  teamCommunicationClarity:
    "Como você avalia a clareza das informações fornecidas pela equipe?",
  medicalTeamRelationship:
    "Como você avalia o relacionamento com a equipe médica?",
  diagnosisExplanation:
    "Como você avalia a clareza com que o médico explicou seu diagnóstico e tratamento?",
  feltHeardByMedicalTeam:
    "Como você avalia o quanto se sentiu ouvido e respeitado pela equipe médica?",
  nursingTeamCare:
    "Como você avalia o atendimento da equipe de enfermagem e multiprofissional?",
  nursingTeamAvailability:
    "Como você avalia a disponibilidade e atenção da equipe quando solicitada?",
  feltSafeWithCare:
    "Como você avalia sua segurança em relação aos cuidados recebidos?",
  technologyAccess:
    "Como você avalia o acesso à tecnologia disponível (TV, Wi-Fi, sistemas)?",
  connectivitySatisfaction:
    "Como você avalia a conectividade oferecida durante a internação?",
  laundryCleanlinessOrganization:
    "Como você avalia a limpeza e organização das roupas de cama?",
  laundryChangeFrequency:
    "Como você avalia a frequência e regularidade da troca de roupas?",
};

const safetyLabels: Record<keyof PatientSafetyAnswers, string> = {
  usedIdentificationBracelet:
    "Você utilizou pulseira de identificação durante a internação?",
  braceletInfoCorrect: "A pulseira continha informações corretas?",
  bedIdentification: "Havia identificação no leito/quarto?",
  identityCheckedBeforeProcedures:
    "A equipe conferiu sua identificação antes de procedimentos?",
};

const ratingLabels: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "bom",
  4: "muito bom",
  5: "excelente",
};

function safetyColor(value: string): string {
  if (value === "Sim") return "text-green-base";
  if (value === "Não") return "text-red-base";
  return "text-yellow-base";
}

export default function Form2Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form2Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    form2Service.getById(id).then((data) => {
      setForm(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

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

  const avg = form2Service.getAverageInfrastructure(form);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2">
          <Text as="h1" variant="heading-md" className="text-gray-400">
            Respostas do Paciente — Formulário 2
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
              <InfoItem
                label="CPF"
                value={
                  form.patientCpf
                    ? form.patientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                    : "—"
                }
              />
              <InfoItem label="Idade" value={`${form.patientAge} anos`} />
              <InfoItem label="Gênero" value={form.patientGender} />
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

        {/* Infrastructure Ratings */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">
              Avaliação por Categoria
            </Text>
            <div className="flex flex-col gap-3">
              {(Object.keys(infrastructureLabels) as (keyof InfrastructureRatings)[]).map(
                (key) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <Text variant="body-sm" className="text-gray-300">
                      {infrastructureLabels[key]}
                    </Text>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div
                            key={rating}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-xs sm:text-sm font-semibold ${
                              form.infrastructure[key] >= rating
                                ? "bg-blue-base text-white"
                                : "bg-gray-200 text-gray-300"
                            }`}
                          >
                            {rating}
                          </div>
                        ))}
                      </div>
                      <Text variant="body-sm-bold" className="text-gray-400">
                        {ratingLabels[form.infrastructure[key]]}
                      </Text>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </Card>

        {/* Patient Safety */}
        <Card shadow="md">
          <div className="flex flex-col gap-4">
            <Text variant="heading-sm" className="text-gray-400">
              🆔 Identificação do Paciente (Segurança do Paciente)
            </Text>
            <div className="flex flex-col gap-3">
              {(Object.keys(safetyLabels) as (keyof PatientSafetyAnswers)[]).map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0"
                >
                  <Text variant="body-sm" className="text-gray-300">
                    {safetyLabels[key]}
                  </Text>
                  <Text
                    variant="body-md-bold"
                    className={safetyColor(form.patientSafety[key])}
                  >
                    {form.patientSafety[key]}
                  </Text>
                </div>
              ))}
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
