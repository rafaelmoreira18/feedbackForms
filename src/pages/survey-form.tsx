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

export default function SurveyForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [patientInfo, setPatientInfo] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "Masculino" as "Masculino" | "Feminino" | "Outro",
    admissionDate: "",
    dischargeDate: "",
    department: "",
  });

  const [satisfaction, setSatisfaction] = useState<SatisfactionRatings>({
    overallCare: 5,
    nursingCare: 5,
    medicalCare: 5,
    welcoming: 5,
    cleanliness: 5,
    comfort: 5,
    responseTime: 5,
    wouldRecommend: 5,
    overallSatisfaction: 5,
  });

  const [experience, setExperience] = useState<ExperienceAnswers>({
    professionalsIdentified: true,
    nameVerified: true,
    treatmentExplained: true,
    participatedInDecisions: true,
    medicationInstructionsClear: true,
    dischargeOrientationComplete: true,
    knewWhoToAsk: true,
    privacyRespected: true,
  });

  const [comments, setComments] = useState("");

  const departments = [
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

    formService.create({
      ...patientInfo,
      patientAge: parseInt(patientInfo.patientAge),
      satisfaction,
      experience,
      comments,
    });

    setSubmitted(true);
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="flex flex-col gap-2">
      <Text variant="body-sm-bold" className="text-gray-400">
        {label}
      </Text>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            title={ratingLabels[rating]}
            className={`w-12 h-12 rounded-lg font-semibold transition-colors ${
              value >= rating
                ? "bg-blue-base text-white"
                : "bg-gray-200 text-gray-300 hover:bg-gray-300"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <Text variant="caption" className="text-gray-300">
        {ratingLabels[value]}
      </Text>
    </div>
  );

  const BooleanInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <div className="flex flex-col gap-2">
      <Text variant="body-sm-bold" className="text-gray-400">
        {label}
      </Text>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={value}
            onChange={() => onChange(true)}
            className="w-4 h-4"
          />
          <Text variant="body-md">Sim</Text>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!value}
            onChange={() => onChange(false)}
            className="w-4 h-4"
          />
          <Text variant="body-md">Não</Text>
        </label>
      </div>
    </div>
  );

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
              Sua pesquisa foi enviada com sucesso. Redirecionando...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card shadow="md">
          <div className="flex flex-col gap-6">
            <div>
              <Text as="h1" variant="heading-md" className="text-gray-400 mb-2">
                Pesquisa Hospitalar
              </Text>
              <Text variant="body-md" className="text-gray-300">
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
                  value={patientInfo.department}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, department: e.target.value })
                  }
                  required
                />
              </div>

              {/* Form 1: Satisfaction */}
              <div className="flex flex-col gap-4">
                <div>
                  <Text variant="heading-sm" className="text-gray-400">
                    1. Pesquisa de Satisfação do Paciente
                  </Text><hr />
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Avalie sendo 1: (Muito Ruim)
                  </Text><br />
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Avalie sendo 2: (Ruim)
                  </Text><br />
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Avalie sendo 3: (Bom)
                  </Text><br />
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Avalie sendo 4: (Muito bom)
                  </Text><br />
                  <Text variant="body-sm" className="text-gray-300 mt-1">
                    Avalie sendo 5: (Excelente)
                  </Text>
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

              <div className="flex gap-4">
                <Button type="button" variant="secondary" onClick={() => navigate("/")}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Enviar Pesquisa
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}