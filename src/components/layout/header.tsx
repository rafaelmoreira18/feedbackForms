import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, ClipboardCheck, LayoutDashboard, LogOut, Users, LineChart, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { tenantService } from "@/services/tenant-service";
import { ROUTES } from "@/routes";
import logoMediall from "@/assets/Logo_mediall.png";

export default function Header() {
  const { isAuthenticated, user, logout, activeTenantSlug, setActiveTenantSlug } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHoldingAdmin = user?.role === 'holding_admin';
  const isAdminRole = user?.role === 'holding_admin' || user?.role === 'hospital_admin';
  const isProtocolo =
    user?.role === 'protocolo_operador' ||
    user?.role === 'protocolo_medico' ||
    user?.role === 'protocolo_admin' ||
    user?.role === 'protocolo_admin_global';
  // Admins de protocolo veem o atalho do dashboard de protocolos (operador não)
  const isProtocoloAdmin =
    user?.role === 'protocolo_admin' || user?.role === 'protocolo_admin_global';
  const isDashboard = location.pathname === "/dashboard";

  // Protocolo selecionado (a partir da URL) — para o seletor de troca de protocolo.
  const protoMatch = location.pathname.match(/\/protocolos\/(dor_toracica|sepse)\b/);
  const currentProto = protoMatch?.[1] ?? "";

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantService.getAll,
    enabled: isAuthenticated && isHoldingAdmin,
  });

  const handleTenantChange = (slug: string) => {
    setActiveTenantSlug(slug);
    if (!slug) return;
    const current = location.pathname;
    // Routes without a tenant slug in the path — stay put
    if (current.startsWith(ROUTES.dashboard) || current === '/') {
      return;
    }
    // Replace the tenant slug segment if present
    const prevSlug = activeTenantSlug;
    if (prevSlug && current.startsWith(`/${prevSlug}/`)) {
      navigate(current.replace(`/${prevSlug}/`, `/${slug}/`));
    } else {
      navigate(ROUTES.pesquisa(slug));
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2 min-w-0">
        <img
          src={logoMediall}
          alt="Mediall"
          className="h-17 object-contain shrink-0 cursor-pointer"
          onClick={() => navigate("/")}
        />

        {isAuthenticated && user && (
          <div className="flex items-center gap-2 flex-1 justify-end">

            {/* Tenant selector — holding_admin only */}
            {isHoldingAdmin && (
              <select
                value={activeTenantSlug}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="text-sm font-sans border border-gray-200 rounded-xl px-3 py-2 text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-base min-w-0 max-w-30 sm:max-w-50"
              >
                <option value="">Selecione uma unidade...</option>
                {allTenants.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            )}

            {/* Pesquisas — non-global roles with fixed tenant (protocolo profiles excluded) */}
            {!isHoldingAdmin && user.role !== 'rh_admin' && !isProtocolo && activeTenantSlug && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.pesquisa(activeTenantSlug))}
                title="Pesquisas"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <ClipboardList size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Pesquisas</span>
              </button>
            )}

            {/* RH Hub — rh_admin */}
            {user.role === 'rh_admin' && (
              <button
                type="button"
                onClick={() => navigate(
                  activeTenantSlug ? ROUTES.rhHub(activeTenantSlug) : ROUTES.rhHubGlobal
                )}
                title="RH"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <LineChart size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">RH</span>
              </button>
            )}

            {/* Seletor de protocolo — troca rápida entre Dor Torácica e Sepse */}
            {isProtocolo && (
              <select
                value={currentProto}
                onChange={(e) => {
                  if (e.target.value) navigate(ROUTES.protocolosLista(user.tenantSlug ?? undefined, e.target.value));
                }}
                title="Trocar protocolo"
                className="text-sm font-sans border border-gray-200 rounded-xl px-3 py-2 text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-base"
              >
                <option value="">Protocolo...</option>
                <option value="dor_toracica">Dor Torácica</option>
                <option value="sepse">Sepse</option>
              </select>
            )}

            {/* Protocolos — perfis do módulo de protocolos (volta à home de cards) */}
            {isProtocolo && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.protocolos(user.tenantSlug ?? undefined))}
                title="Protocolos"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <HeartPulse size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Protocolos</span>
              </button>
            )}

            {/* Dashboard de protocolos — admins de protocolo (sempre visível, igual aos demais) */}
            {isProtocoloAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.protocolosDashboard(user.tenantSlug ?? undefined))}
                title="Dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <LayoutDashboard size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Dashboard</span>
              </button>
            )}

            {/* Dashboard — admin roles, hidden when already on dashboard */}
            {isAdminRole && !isDashboard && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.dashboard)}
                title="Dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <LayoutDashboard size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Dashboard</span>
              </button>
            )}

            {/* Concluídos — todos os perfis de protocolo (operador/médico em modo leitura, igual ao admin) */}
            {isProtocolo && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.protocolosConcluidos(user.tenantSlug ?? undefined))}
                title="Concluídos"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <ClipboardCheck size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Concluídos</span>
              </button>
            )}

            {/* Usuários — holding_admin only */}
            {isHoldingAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.adminUsuarios)}
                title="Usuários"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
              >
                <Users size={20} />
                <span className="text-sm font-semibold font-sans hidden sm:inline">Usuários</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { logout(); navigate(ROUTES.login); }}
              title="Sair"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-blue-base hover:bg-blue-base/10 transition-colors duration-150 border-l border-gray-100 ml-2 pl-4"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
