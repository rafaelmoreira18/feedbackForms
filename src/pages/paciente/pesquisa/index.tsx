import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { tenantService } from "@/services/tenant-service";
import type { FormTemplate } from "@/types";
import {
  BedDouble,
  FlaskConical,
  Stethoscope,
  HeartPulse,
  Ambulance,
  Droplets,
  Scissors,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SLUG_ICONS: Record<string, LucideIcon> = {
  "internacao": BedDouble,
  "exames": FlaskConical,
  "ambulatorio": Stethoscope,
  "uti": HeartPulse,
  "pronto-socorro": Ambulance,
  "hemodialise": Droplets,
  "centro-cirurgico": Scissors,
};

export default function Pesquisa() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!tenantSlug) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    tenantService.getFormTemplates(tenantSlug)
      .then(setTemplates)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tenantSlug, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-300 font-sans">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-sans">Erro ao carregar pesquisas.</p>
        <button
          type="button"
          onClick={() => setRetryCount(c => c + 1)}
          className="px-4 py-2 rounded-xl bg-teal-base text-white font-sans font-semibold text-sm hover:bg-teal-dark transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

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
          {templates.map((tmpl) => {
            const Icon = SLUG_ICONS[tmpl.slug] ?? ClipboardList;
            return (
              <button
                key={tmpl.slug}
                type="button"
                onClick={() => navigate(ROUTES.survey(tenantSlug, tmpl.slug))}
                className="text-left group"
              >
                <div className="h-full bg-white rounded-2xl p-5 flex flex-col gap-3 border-2 border-transparent group-hover:border-teal-base transition-all duration-200 group-hover:shadow-xl shadow-md">
                  <div className="w-12 h-12 bg-teal-base rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold text-gray-400 font-sans group-hover:text-teal-dark transition-colors">
                    {tmpl.name}
                  </h2>
                  <div className="flex items-center gap-1 mt-auto text-teal-base font-sans font-semibold text-sm">
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
