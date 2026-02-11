import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formService } from "../services/form-service";
import type { SatisfactionRatings, ExperienceAnswers } from "../types";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Textarea from "../components/textarea";
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
      <div className="flex gap-2">
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

function BooleanInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-sm-bold" className="text-gray-400">
        {label}
      </Text>
      <div className="flex gap-3">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(true)}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
            value === true
              ? "bg-green-base text-white"
              : "bg-gray-200 text-gray-300 hover:bg-gray-300"
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(false)}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
            value === false
              ? "bg-red-base text-white"
              : "bg-gray-200 text-gray-300 hover:bg-gray-300"
          }`}
        >
          Não
        </button>
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

export default function SurveyForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [patientInfo, setPatientInfo] = useState({
    patientName: "",
    patientCpf: "",
    patientAge: "",
    patientGender: "Masculino" as "Masculino" | "Feminino" | "Outro",
    admissionDate: "",
    dischargeDate: "",
    evaluatedDepartment: "",
  });

  const [cpfError, setCpfError] = useState("");

  const [satisfaction, setSatisfaction] = useState<SatisfactionRatings>({
    overallCare: 0,
    nursingCare: 0,
    medicalCare: 0,
    welcoming: 0,
    cleanliness: 0,
    comfort: 0,
    responseTime: 0,
    wouldRecommend: 0,
    overallSatisfaction: 0,
  });

  type NullableExperience = Record<keyof ExperienceAnswers, boolean | null>;

  const [experience, setExperience] = useState<NullableExperience>({
    professionalsIdentified: null,
    nameVerified: null,
    treatmentExplained: null,
    participatedInDecisions: null,
    medicationInstructionsClear: null,
    dischargeOrientationComplete: null,
    knewWhoToAsk: null,
    privacyRespected: null,
  });

  const [comments, setComments] = useState("");

  const departments = [
    { value: "", label: "Selecione o departamento" },
    { value: "Emergência", label: "Emergência" },
    { value: "UTI", label: "UTI" },
    { value: "Internação Geral", label: "Internação Geral" },
    { value: "Cirurgia", label: "Cirurgia" },
    { value: "Pediatria", label: "Pediatria" },
    { value: "Maternidade", label: "Maternidade" },
    { value: "Oncologia", label: "Oncologia" },
  ];

  const genderOptions = [
    { value: "Masculino", label: "Masculino" },
    { value: "Feminino", label: "Feminino" },
    { value: "Outro", label: "Outro" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidCpf(patientInfo.patientCpf)) {
      setCpfError("CPF inválido");
      return;
    }
    setCpfError("");

    const resolvedExperience: ExperienceAnswers = {
      professionalsIdentified: experience.professionalsIdentified ?? false,
      nameVerified: experience.nameVerified ?? false,
      treatmentExplained: experience.treatmentExplained ?? false,
      participatedInDecisions: experience.participatedInDecisions ?? false,
      medicationInstructionsClear: experience.medicationInstructionsClear ?? false,
      dischargeOrientationComplete: experience.dischargeOrientationComplete ?? false,
      knewWhoToAsk: experience.knewWhoToAsk ?? false,
      privacyRespected: experience.privacyRespected ?? false,
    };

    formService.create({
      ...patientInfo,
      patientCpf: patientInfo.patientCpf.replace(/\D/g, ""),
      patientAge: parseInt(patientInfo.patientAge),
      satisfaction,
      experience: resolvedExperience,
      comments,
    });

    setSubmitted(true);
    setTimeout(() => {
      navigate("/survey");
    }, 3000);
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
                Pesquisa Hospitalar
              </Text>
              <Text variant="body-sm" className="text-gray-300 sm:text-base">
                Sua opinião é muito importante para melhorarmos nossos serviços
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

                <Select
                  label="Departamento"
                  options={departments}
                  value={patientInfo.evaluatedDepartment}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, evaluatedDepartment: e.target.value })
                  }
                  required
                />
              </div>

              {/* Form 1: Satisfaction */}
              <div className="flex flex-col gap-4">
                <div>
                  <Text variant="heading-sm" className="text-gray-400">
                    1. Pesquisa de Satisfação do Paciente
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

                {(Object.keys(satisfactionLabels) as (keyof SatisfactionRatings)[]).map(
                  (key) => (
                    <RatingInput
                      key={key}
                      label={satisfactionLabels[key]}
                      value={satisfaction[key]}
                      onChange={(value) =>
                        setSatisfaction({ ...satisfaction, [key]: value })
                      }
                    />
                  )
                )}
              </div>

              {/* Form 2: Experience */}
              <div className="flex flex-col gap-4">
                <div>
                  <Text variant="heading-sm" className="text-gray-400">
                    2. Pesquisa de Experiência do Paciente
                  </Text>
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Responda com Sim ou Não
                  </Text>
                </div>

                {(Object.keys(experienceLabels) as (keyof ExperienceAnswers)[]).map(
                  (key) => (
                    <BooleanInput
                      key={key}
                      label={experienceLabels[key]}
                      value={experience[key]}
                      onChange={(value) =>
                        setExperience({ ...experience, [key]: value })
                      }
                    />
                  )
                )}
              </div>

              {/* Comments */}
              <Textarea
                label="Comentários Adicionais (Opcional)"
                placeholder="Deixe aqui seus comentários, sugestões ou críticas..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />

              <Button type="submit">
                Enviar Pesquisa
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}