import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, LayoutDashboard, LogOut } from "lucide-react";
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
  const isDashboard = location.pathname === "/dashboard";

  const { data: allTenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantService.getAll,
    enabled: isAuthenticated && isHoldingAdmin,
  });

  const handleTenantChange = (slug: string) => {
    setActiveTenantSlug(slug);
    if (slug) navigate(ROUTES.pesquisa(slug));
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <img
          src={logoMediall}
          alt="Mediall"
          className="h-17 object-contain shrink-0"
        />

        {isAuthenticated && user && (
          <div className="flex items-center gap-2 flex-1 justify-end">

            {/* Tenant selector — holding_admin only */}
            {isHoldingAdmin && (
              <select
                value={activeTenantSlug}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="text-sm font-sans border border-gray-200 rounded-xl px-3 py-2 text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-base max-w-50"
              >
                <option value="">Selecione uma unidade...</option>
                {allTenants.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            )}

            {/* Pesquisas — non-global roles with fixed tenant */}
            {!isHoldingAdmin && user.role !== 'rh_admin' && activeTenantSlug && (
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
