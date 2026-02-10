import { formService } from "../services/form-service";
import type { FormResponse } from "../types";

export function seedDatabase() {
  // Check if data already exists
  if (formService.getAll().length > 0) {
    return;
  }

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

  // Generate sample data for the last 3 months
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);

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
      overallSatisfaction: Math.floor(Math.random() * 3) + 3, // 3-5 stars (mostly positive)
      medicalCareQuality: Math.floor(Math.random() * 3) + 3,
      nursingCareQuality: Math.floor(Math.random() * 3) + 3,
      facilitiesQuality: Math.floor(Math.random() * 4) + 2, // 2-5 stars
      waitingTime: Math.floor(Math.random() * 4) + 2,
      communicationQuality: Math.floor(Math.random() * 3) + 3,
      wouldRecommend: Math.random() > 0.2, // 80% would recommend
      comments: Math.random() > 0.4 ? comments[Math.floor(Math.random() * comments.length)] : "",
    };

    // Override the createdAt by directly manipulating localStorage
    const form = formService.create(formData);
    const allForms = formService.getAll();
    const formIndex = allForms.findIndex((f) => f.id === form.id);
    if (formIndex !== -1) {
      allForms[formIndex].createdAt = randomDate.toISOString();
      localStorage.setItem("hospital_forms", JSON.stringify(allForms));
    }
  }
}
