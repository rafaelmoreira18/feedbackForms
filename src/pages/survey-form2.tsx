import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { form2Service } from "../services/form2-service";
import type { InfrastructureRatings, PatientSafetyAnswers } from "../types";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Textarea from "../components/textarea";
import Button from "../components/button";
import Card from "../components/card";

// ─── Question labels ──────────────────────────────────────────────────────────

type InfraSection = {
  title: string;
  emoji: string;
  keys: (keyof InfrastructureRatings)[];
};

const infrastructureSections: InfraSection[] = [
  {
    title: "Infraestrutura",
    emoji: "🏥",
    keys: ["hospitalOverallInfrastructure", "commonAreasAdequacy"],
  },
  {
    title: "Equipamentos",
    emoji: "🩺",
    keys: ["equipmentSafety", "equipmentCondition"],
  },
  {
    title: "Acomodação",
    emoji: "🛏️",
    keys: ["bedComfort", "accommodationNeeds"],
  },
  {
    title: "Nutrição",
    emoji: "🍽️",
    keys: ["mealQuality", "mealTimeliness", "nutritionTeamCare"],
  },
  {
    title: "Comunicação e Sinalização",
    emoji: "🧭",
    keys: ["hospitalSignage", "teamCommunicationClarity"],
  },
  {
    title: "Relacionamento com a Equipe Médica",
    emoji: "👨‍⚕️",
    keys: ["medicalTeamRelationship", "diagnosisExplanation", "feltHeardByMedicalTeam"],
  },
  {
    title: "Relacionamento com a Equipe Assistencial",
    emoji: "👩‍⚕️",
    keys: ["nursingTeamCare", "nursingTeamAvailability", "feltSafeWithCare"],
  },
  {
    title: "Tecnologia e Conectividade",
    emoji: "💻",
    keys: ["technologyAccess", "connectivitySatisfaction"],
  },
  {
    title: "Lavanderia",
    emoji: "👕",
    keys: ["laundryCleanlinessOrganization", "laundryChangeFrequency"],
  },
];

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
  3: "Bom",
  4: "Muito bom",
  5: "Excelente",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-sm-bold" className="text-gray-400">
        {label}
      </Text>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(rating)}
            title={ratingLabels[rating]}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold transition-colors ${
              value >= rating
                ? "bg-blue-base text-white"
                : "bg-gray-200 text-gray-300 hover:bg-gray-300"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      {value > 0 && (
        <Text variant="caption" className="text-gray-300">
          {ratingLabels[value]}
        </Text>
      )}
    </div>
  );
}

function TriInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Sim" | "Não" | "Parcialmente" | null;
  onChange: (value: "Sim" | "Não" | "Parcialmente") => void;
}) {
  const options: Array<"Sim" | "Não" | "Parcialmente"> = ["Sim", "Não", "Parcialmente"];

  const colorMap: Record<string, string> = {
    Sim: "bg-green-base text-white",
    Não: "bg-red-base text-white",
    Parcialmente: "bg-yellow-base text-white",
  };

  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-sm-bold" className="text-gray-400">
        {label}
      </Text>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              value === opt
                ? colorMap[opt]
                : "bg-gray-200 text-gray-300 hover:bg-gray-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[10]) !== check) return false;

  return true;
}

// ─── Default state helpers ─────────────────────────────────────────────────────

function defaultInfrastructure(): InfrastructureRatings {
  return {
    hospitalOverallInfrastructure: 0,
    commonAreasAdequacy: 0,
    equipmentSafety: 0,
    equipmentCondition: 0,
    bedComfort: 0,
    accommodationNeeds: 0,
    mealQuality: 0,
    mealTimeliness: 0,
    nutritionTeamCare: 0,
    hospitalSignage: 0,
    teamCommunicationClarity: 0,
    medicalTeamRelationship: 0,
    diagnosisExplanation: 0,
    feltHeardByMedicalTeam: 0,
    nursingTeamCare: 0,
    nursingTeamAvailability: 0,
    feltSafeWithCare: 0,
    technologyAccess: 0,
    connectivitySatisfaction: 0,
    laundryCleanlinessOrganization: 0,
    laundryChangeFrequency: 0,
  };
}

type NullableSafety = Record<keyof PatientSafetyAnswers, "Sim" | "Não" | "Parcialmente" | null>;

function defaultSafety(): NullableSafety {
  return {
    usedIdentificationBracelet: null,
    braceletInfoCorrect: null,
    bedIdentification: null,
    identityCheckedBeforeProcedures: null,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveyForm2() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [patientInfo, setPatientInfo] = useState({
    patientName: "",
    patientCpf: "",
    patientAge: "",
    patientGender: "Masculino" as "Masculino" | "Feminino" | "Outro",
    admissionDate: "",
    dischargeDate: "",
  });

  const [cpfError, setCpfError] = useState("");
  const [infrastructure, setInfrastructure] = useState<InfrastructureRatings>(defaultInfrastructure());
  const [patientSafety, setPatientSafety] = useState<NullableSafety>(defaultSafety());
  const [comments, setComments] = useState("");

  const genderOptions = [
    { value: "Masculino", label: "Masculino" },
    { value: "Feminino", label: "Feminino" },
    { value: "Outro", label: "Outro" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidCpf(patientInfo.patientCpf)) {
      setCpfError("CPF inválido");
      return;
    }
    setCpfError("");

    const resolvedSafety: PatientSafetyAnswers = {
      usedIdentificationBracelet: patientSafety.usedIdentificationBracelet ?? "Não",
      braceletInfoCorrect: patientSafety.braceletInfoCorrect ?? "Não",
      bedIdentification: patientSafety.bedIdentification ?? "Não",
      identityCheckedBeforeProcedures: patientSafety.identityCheckedBeforeProcedures ?? "Não",
    };

    try {
      await form2Service.create({
        ...patientInfo,
        patientCpf: patientInfo.patientCpf.replace(/\D/g, ""),
        patientAge: parseInt(patientInfo.patientAge),
        infrastructure,
        patientSafety: resolvedSafety,
        comments,
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate("/survey2");
      }, 3000);
    } catch {
      // submission failed, user can retry
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center" shadow="md">
          <div className="flex flex-col gap-4">
            <div className="w-16 h-16 bg-green-base rounded-full flex items-center justify-center mx-auto">
              <Text variant="heading-md" className="text-white">✓</Text>
            </div>
            <Text variant="heading-md" className="text-gray-400">
              Obrigado!
            </Text>
            <Text variant="body-md" className="text-gray-300">
              Sua pesquisa foi enviada com sucesso.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <Card shadow="md" padding="sm" className="sm:p-6">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div>
              <Text as="h1" variant="heading-md" className="text-gray-400 mb-2">
                Pesquisa de Infraestrutura e Cuidados
              </Text>
              <Text variant="body-sm" className="text-gray-300 sm:text-base">
                Avalie a infraestrutura, os cuidados e os serviços do hospital
              </Text>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* Patient Info */}
              <div className="flex flex-col gap-4">
                <Text variant="heading-sm" className="text-gray-400">
                  Informações do Paciente
                </Text>

                <Input
                  label="Nome Completo"
                  type="text"
                  value={patientInfo.patientName}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, patientName: e.target.value })
                  }
                  required
                />

                <Input
                  label="CPF"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={patientInfo.patientCpf}
                  onChange={(e) => {
                    const formatted = formatCpf(e.target.value);
                    setPatientInfo({ ...patientInfo, patientCpf: formatted });
                    if (cpfError) setCpfError("");
                  }}
                  error={cpfError}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Idade"
                    type="number"
                    min="0"
                    max="150"
                    value={patientInfo.patientAge}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, patientAge: e.target.value })
                    }
                    required
                  />

                  <Select
                    label="Gênero"
                    options={genderOptions}
                    value={patientInfo.patientGender}
                    onChange={(e) =>
                      setPatientInfo({
                        ...patientInfo,
                        patientGender: e.target.value as typeof patientInfo.patientGender,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data de Admissão"
                    type="date"
                    value={patientInfo.admissionDate}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, admissionDate: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Data de Alta"
                    type="date"
                    value={patientInfo.dischargeDate}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, dischargeDate: e.target.value })
                    }
                    required
                  />
                </div>

              </div>

              {/* Infrastructure Sections */}
              <div className="flex flex-col gap-6">
                <div>
                  <Text variant="heading-sm" className="text-gray-400">
                    Avaliação por Categoria
                  </Text>
                  <hr className="my-2" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {Object.entries(ratingLabels).map(([num, label]) => (
                      <Text key={num} variant="body-sm" className="text-gray-300">
                        {num}: {label}
                      </Text>
                    ))}
                  </div>
                </div>

                {infrastructureSections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-3">
                    <Text variant="body-md-bold" className="text-gray-400">
                      {section.emoji} {section.title}
                    </Text>
                    {section.keys.map((key) => (
                      <RatingInput
                        key={key}
                        label={infrastructureLabels[key]}
                        value={infrastructure[key]}
                        onChange={(value) =>
                          setInfrastructure({ ...infrastructure, [key]: value })
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Patient Safety */}
              <div className="flex flex-col gap-4">
                <div>
                  <Text variant="heading-sm" className="text-gray-400">
                    🆔 Identificação do Paciente (Segurança do Paciente)
                  </Text>
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Responda com Sim, Não ou Parcialmente
                  </Text>
                </div>

                {(Object.keys(safetyLabels) as (keyof PatientSafetyAnswers)[]).map((key) => (
                  <TriInput
                    key={key}
                    label={safetyLabels[key]}
                    value={patientSafety[key]}
                    onChange={(value) =>
                      setPatientSafety({ ...patientSafety, [key]: value })
                    }
                  />
                ))}
              </div>

              {/* Comments */}
              <Textarea
                label="Comentários Adicionais (Opcional)"
                placeholder="Deixe aqui seus comentários, sugestões ou críticas..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />

              <Button type="submit">Enviar Pesquisa</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
