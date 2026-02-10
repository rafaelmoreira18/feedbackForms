import { formService } from "../services/form-service";
import type { FormResponse } from "../types";

export function seedDatabase() {
  const existing = formService.getAll();
  if (existing.length > 0 && existing[0].satisfaction) {
    return;
  }
  localStorage.removeItem("hospital_forms");

  const departments = [
    "Emergência",
    "UTI",
    "Internação Geral",
    "Cirurgia",
    "Pediatria",
    "Maternidade",
    "Oncologia",
  ];

  const names = [
    "João Silva",
    "Maria Santos",
    "Pedro Oliveira",
    "Ana Costa",
    "Carlos Souza",
    "Fernanda Lima",
    "Ricardo Alves",
    "Juliana Pereira",
    "Paulo Rodrigues",
    "Camila Fernandes",
  ];

  const comments = [
    "Excelente atendimento, equipe muito atenciosa.",
    "Ótima experiência, me senti muito bem cuidado.",
    "Algumas melhorias podem ser feitas nas instalações.",
    "Atendimento rápido e eficiente.",
    "Equipe médica muito competente.",
    "",
    "Tempo de espera um pouco longo, mas o atendimento foi bom.",
    "Muito satisfeito com o tratamento recebido.",
    "Instalações limpas e modernas.",
    "Recomendo o hospital.",
  ];

  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  const randomRating = (min: number) => Math.floor(Math.random() * (6 - min)) + min;
  const randomBool = (chance: number) => Math.random() < chance;

  for (let i = 0; i < 50; i++) {
    const randomDate = new Date(
      threeMonthsAgo.getTime() +
        Math.random() * (today.getTime() - threeMonthsAgo.getTime())
    );

    const admissionDate = new Date(randomDate);
    admissionDate.setDate(admissionDate.getDate() - Math.floor(Math.random() * 7) - 1);

    const formData: Omit<FormResponse, "id" | "createdAt"> = {
      patientName: names[Math.floor(Math.random() * names.length)],
      patientAge: Math.floor(Math.random() * 70) + 18,
      patientGender: ["Masculino", "Feminino", "Outro"][
        Math.floor(Math.random() * 3)
      ] as "Masculino" | "Feminino" | "Outro",
      admissionDate: admissionDate.toISOString().split("T")[0],
      dischargeDate: randomDate.toISOString().split("T")[0],
      department: departments[Math.floor(Math.random() * departments.length)],
      satisfaction: {
        overallCare: randomRating(3),
        nursingCare: randomRating(3),
        medicalCare: randomRating(3),
        welcoming: randomRating(3),
        cleanliness: randomRating(2),
        comfort: randomRating(2),
        responseTime: randomRating(2),
        wouldRecommend: randomRating(3),
        overallSatisfaction: randomRating(3),
      },
      experience: {
        professionalsIdentified: randomBool(0.85),
        nameVerified: randomBool(0.9),
        treatmentExplained: randomBool(0.8),
        participatedInDecisions: randomBool(0.7),
        medicationInstructionsClear: randomBool(0.85),
        dischargeOrientationComplete: randomBool(0.75),
        knewWhoToAsk: randomBool(0.8),
        privacyRespected: randomBool(0.9),
      },
      comments: Math.random() > 0.4
        ? comments[Math.floor(Math.random() * comments.length)]
        : "",
    };

    const form = formService.create(formData);
    const allForms = formService.getAll();
    const formIndex = allForms.findIndex((f) => f.id === form.id);
    if (formIndex !== -1) {
      allForms[formIndex].createdAt = randomDate.toISOString();
      localStorage.setItem("hospital_forms", JSON.stringify(allForms));
    }
  }
}