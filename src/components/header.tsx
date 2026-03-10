import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { ROUTES } from "../routes";
import logoMediall from "../assets/Logo_mediall.png";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPesquisa = location.pathname.endsWith("/pesquisa");
  const isAnalytics = location.pathname.endsWith("/analytics");
  const tenantSlug = user?.tenantSlug ?? "hgm";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <img
          src={logoMediall}
          alt="Mediall"
          className="h-17 object-contain"
        />
        {isAuthenticated && user && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(ROUTES.pesquisa(tenantSlug))}
              title="Pesquisas"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-base hover:bg-teal-light transition-colors duration-150"
            >
              <ClipboardList size={20} />
              <span className="text-sm font-semibold font-sans hidden sm:inline">Pesquisas</span>
            </button>
            {(isPesquisa || isAnalytics) && (
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
          </div>
        )}
      </div>
    </header>
  );
}
