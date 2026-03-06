import { useNavigate } from "react-router-dom";
import { FORM3_DEPARTMENT_OPTIONS, FORM3_SLUGS } from "./survey-form3-config";
import type { Form3Type } from "../types";
import {
  BedDouble,
  FlaskConical,
  Stethoscope,
  HeartPulse,
  Ambulance,
  Droplets,
  Scissors,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const DEPARTMENT_ICONS: Record<Form3Type, LucideIcon> = {
  "Internação Hospitalar": BedDouble,
  "Exames Laboratoriais e de Imagem": FlaskConical,
  "Ambulatório": Stethoscope,
  "UTI": HeartPulse,
  "Pronto Socorro": Ambulance,
  "Hemodiálise": Droplets,
  "Centro Cirúrgico": Scissors,
};

const DEPARTMENT_DESCRIPTIONS: Record<Form3Type, string> = {
  "Internação Hospitalar": "Avalie o conforto, limpeza, organização e o atendimento recebido durante sua internação",
  "Exames Laboratoriais e de Imagem": "Avalie as instalações, a clareza das orientações e o cuidado da equipe durante seus exames",
  "Ambulatório": "Avalie as condições do ambulatório e o atendimento recebido no seu consulta",
  "UTI": "Avalie as instalações da UTI e o atendimento da equipe médica e de enfermagem",
  "Pronto Socorro": "Avalie as condições do Pronto Socorro e o cuidado recebido no seu atendimento",
  "Hemodiálise": "Avalie as instalações e o atendimento recebido durante suas sessões de hemodiálise",
  "Centro Cirúrgico": "Avalie as instalações e as orientações recebidas antes e após seu procedimento cirúrgico",
};

export default function Pesquisa() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-dark font-sans">
            Pesquisa de Satisfação &amp; Experiência do Paciente
          </h1>
          <p className="text-gray-300 font-sans text-sm sm:text-base">
            Selecione o setor onde você foi atendido para responder a pesquisa
          </p>
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FORM3_DEPARTMENT_OPTIONS.map((dept) => {
            const Icon = DEPARTMENT_ICONS[dept];
            return (
              <button
                key={dept}
                type="button"
                onClick={() => navigate(`/${FORM3_SLUGS[dept]}`)}
                className="text-left group"
              >
                <div className="h-full bg-white rounded-2xl p-5 flex flex-col gap-3 border-2 border-transparent group-hover:border-teal-base transition-all duration-200 group-hover:shadow-xl shadow-md">
                  <div className="w-12 h-12 bg-teal-base rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold text-gray-400 font-sans group-hover:text-teal-dark transition-colors">
                    {dept}
                  </h2>
                  <p className="text-sm text-gray-300 font-sans flex-1 leading-relaxed">
                    {DEPARTMENT_DESCRIPTIONS[dept]}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-teal-base font-sans font-semibold text-sm">
                    Responder pesquisa
                    <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-300 font-sans">
            Suas respostas são confidenciais e nos ajudam a melhorar continuamente nossos serviços
          </p>
        </div>

      </div>
    </div>
  );
}
