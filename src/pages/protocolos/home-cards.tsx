import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Users, ChevronRight } from "lucide-react";
import { ALL_PROTOCOLOS } from "./registry";

/** Home dos protocolos — grade de cards. Selecionar um card entra na lista do protocolo. */
export default function ProtocolosHomeCards() {
  const { tenantSlug: slugFromUrl } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin =
    user?.role === "protocolo_admin_global" ||
    user?.role === "holding_admin" ||
    user?.role === "protocolo_admin";

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Text variant="heading-md" className="text-gray-400">Protocolos</Text>
            <Text variant="body-sm" className="text-gray-300">Selecione o protocolo que deseja operar.</Text>
          </div>
          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.protocolosUsuarios(slugFromUrl))}>
              <Users size={18} /> Usuários
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_PROTOCOLOS.map((def) => {
            const Icon = def.icon;
            return (
              <Card
                key={def.type}
                shadow="sm"
                className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-teal-light"
              >
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.protocolosLista(slugFromUrl, def.type))}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <span className="rounded-xl bg-teal-light/60 p-2.5 shrink-0">
                    <Icon size={24} className={def.accent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Text variant="body-md-bold" className="text-gray-400 block">{def.shortLabel}</Text>
                    <Text variant="caption" className="text-gray-300 block">{def.descricao}</Text>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 shrink-0 mt-1" />
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
