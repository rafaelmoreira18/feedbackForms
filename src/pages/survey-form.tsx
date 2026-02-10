import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formService } from "../services/form-service";
import Text from "../components/text";
import Input from "../components/input";
import Select from "../components/select";
import Textarea from "../components/textarea";
import Button from "../components/button";
import Card from "../components/card";

export default function SurveyForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "Masculino" as "Masculino" | "Feminino" | "Outro",
    admissionDate: "",
    dischargeDate: "",
    department: "",
    overallSatisfaction: 5,
    medicalCareQuality: 5,
    nursingCareQuality: 5,
    facilitiesQuality: 5,
    waitingTime: 5,
    communicationQuality: 5,
    wouldRecommend: true,
    comments: "",
  });

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
      ...formData,
      patientAge: parseInt(formData.patientAge),
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
                Pesquisa de Satisfação
              </Text>
              <Text variant="body-md" className="text-gray-300">
                Sua opinião é muito importante para melhorarmos nossos serviços
              </Text>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <Text variant="heading-sm" className="text-gray-400">
                  Informações do Paciente
                </Text>

                <Input
                  label="Nome Completo"
                  type="text"
                  value={formData.patientName}
                  onChange={(e) =>
                    setFormData({ ...formData, patientName: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Idade"
                    type="number"
                    min="0"
                    max="150"
                    value={formData.patientAge}
                    onChange={(e) =>
                      setFormData({ ...formData, patientAge: e.target.value })
                    }
                    required
                  />

                  <Select
                    label="Gênero"
                    options={genderOptions}
                    value={formData.patientGender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        patientGender: e.target.value as typeof formData.patientGender,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data de Admissão"
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) =>
                      setFormData({ ...formData, admissionDate: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Data de Alta"
                    type="date"
                    value={formData.dischargeDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dischargeDate: e.target.value })
                    }
                    required
                  />
                </div>

                <Select
                  label="Departamento"
                  options={departments}
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <Text variant="heading-sm" className="text-gray-400">
                  Avaliação dos Serviços
                </Text>
                <Text variant="body-sm" className="text-gray-300">
                  Avalie de 1 (muito insatisfeito) a 5 (muito satisfeito)
                </Text>

                <RatingInput
                  label="Satisfação Geral"
                  value={formData.overallSatisfaction}
                  onChange={(value) =>
                    setFormData({ ...formData, overallSatisfaction: value })
                  }
                />

                <RatingInput
                  label="Qualidade do Atendimento Médico"
                  value={formData.medicalCareQuality}
                  onChange={(value) =>
                    setFormData({ ...formData, medicalCareQuality: value })
                  }
                />

                <RatingInput
                  label="Qualidade do Atendimento de Enfermagem"
                  value={formData.nursingCareQuality}
                  onChange={(value) =>
                    setFormData({ ...formData, nursingCareQuality: value })
                  }
                />

                <RatingInput
                  label="Qualidade das Instalações"
                  value={formData.facilitiesQuality}
                  onChange={(value) =>
                    setFormData({ ...formData, facilitiesQuality: value })
                  }
                />

                <RatingInput
                  label="Tempo de Espera"
                  value={formData.waitingTime}
                  onChange={(value) =>
                    setFormData({ ...formData, waitingTime: value })
                  }
                />

                <RatingInput
                  label="Qualidade da Comunicação"
                  value={formData.communicationQuality}
                  onChange={(value) =>
                    setFormData({ ...formData, communicationQuality: value })
                  }
                />

                <div className="flex flex-col gap-2">
                  <Text variant="body-sm-bold" className="text-gray-400">
                    Você recomendaria nosso hospital?
                  </Text>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recommend"
                        checked={formData.wouldRecommend}
                        onChange={() =>
                          setFormData({ ...formData, wouldRecommend: true })
                        }
                        className="w-4 h-4"
                      />
                      <Text variant="body-md">Sim</Text>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recommend"
                        checked={!formData.wouldRecommend}
                        onChange={() =>
                          setFormData({ ...formData, wouldRecommend: false })
                        }
                        className="w-4 h-4"
                      />
                      <Text variant="body-md">Não</Text>
                    </label>
                  </div>
                </div>

                <Textarea
                  label="Comentários Adicionais (Opcional)"
                  placeholder="Deixe aqui seus comentários, sugestões ou críticas..."
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                />
              </div>

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
