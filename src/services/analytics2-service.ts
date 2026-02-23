import type { Form2Response, InfrastructureRatings } from "../types";
import { form2Service } from "./form2-service";

const infrastructureKeys: { key: keyof InfrastructureRatings; label: string }[] = [
  { key: "hospitalOverallInfrastructure", label: "Infraestrutura Geral" },
  { key: "commonAreasAdequacy", label: "Áreas Comuns" },
  { key: "equipmentSafety", label: "Segurança dos Equipamentos" },
  { key: "equipmentCondition", label: "Conservação dos Equipamentos" },
  { key: "bedComfort", label: "Conforto do Leito" },
  { key: "accommodationNeeds", label: "Necessidades da Acomodação" },
  { key: "mealQuality", label: "Qualidade das Refeições" },
  { key: "mealTimeliness", label: "Pontualidade das Refeições" },
  { key: "nutritionTeamCare", label: "Equipe de Nutrição" },
  { key: "hospitalSignage", label: "Sinalização do Hospital" },
  { key: "teamCommunicationClarity", label: "Clareza da Comunicação" },
  { key: "medicalTeamRelationship", label: "Equipe Médica" },
  { key: "diagnosisExplanation", label: "Explicação do Diagnóstico" },
  { key: "feltHeardByMedicalTeam", label: "Sentiu-se Ouvido (Médica)" },
  { key: "nursingTeamCare", label: "Equipe de Enfermagem" },
  { key: "nursingTeamAvailability", label: "Disponibilidade da Enfermagem" },
  { key: "feltSafeWithCare", label: "Segurança nos Cuidados" },
  { key: "technologyAccess", label: "Acesso à Tecnologia" },
  { key: "connectivitySatisfaction", label: "Conectividade" },
  { key: "laundryCleanlinessOrganization", label: "Limpeza das Roupas" },
  { key: "laundryChangeFrequency", label: "Frequência de Troca" },
];

export function getAverageByCategory(forms: Form2Response[]) {
  if (forms.length === 0) return [];

  return infrastructureKeys.map(({ key, label }) => ({
    category: label,
    value: Number(
      (forms.reduce((sum, f) => sum + f.infrastructure[key], 0) / forms.length).toFixed(1)
    ),
  }));
}

export function getPatientSafetyData(forms: Form2Response[]) {
  const keys = [
    { key: "usedIdentificationBracelet" as const, label: "Pulseira de Identificação" },
    { key: "braceletInfoCorrect" as const, label: "Informações Corretas na Pulseira" },
    { key: "bedIdentification" as const, label: "Identificação no Leito" },
    { key: "identityCheckedBeforeProcedures" as const, label: "Identidade Conferida" },
  ];

  return keys.map(({ key, label }) => {
    const sim = forms.filter((f) => f.patientSafety[key] === "Sim").length;
    const nao = forms.filter((f) => f.patientSafety[key] === "Não").length;
    const parcialmente = forms.filter((f) => f.patientSafety[key] === "Parcialmente").length;
    return { label, Sim: sim, Não: nao, Parcialmente: parcialmente };
  });
}

export function getMonthlyTrend(forms: Form2Response[]) {
  const monthMap = new Map<string, number>();

  forms.forEach((form) => {
    const date = new Date(form.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ mes: month, respostas: count }));
}

export function getSummaryMetrics(forms: Form2Response[]) {
  const avgInfra =
    forms.length > 0
      ? forms.reduce((sum, f) => sum + form2Service.getAverageInfrastructure(f), 0) / forms.length
      : 0;

  const safetyScore =
    forms.length > 0
      ? (forms.filter((f) => f.patientSafety.usedIdentificationBracelet === "Sim").length /
          forms.length) *
        100
      : 0;

  return {
    total: forms.length,
    avgInfrastructure: Number(avgInfra.toFixed(1)),
    safetyRate: Number(safetyScore.toFixed(1)),
  };
}
