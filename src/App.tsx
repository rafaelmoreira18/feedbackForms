import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,   // 5 min — dados de analytics não mudam a cada segundo
      gcTime: 30 * 60_000,     // 30 min em cache após ficar inativo
      retry: (failureCount, error: unknown) => {
        // Não tenta novamente em 401/403 — são erros de auth, não transientes
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // evita re-fetch desnecessário ao focar janela
    },
  },
});
import Header from "@/components/layout/header";
import Home from "@/pages/home";
import Login from "@/pages/login";
import ChangePassword from "@/pages/change-password";
import SurveyForm3 from "@/pages/survey";
import Pesquisa from "@/pages/pesquisa";
import Dashboard from "@/pages/dashboard";
import Analytics3 from "@/pages/analytics";
import Form3Preview from "@/pages/survey/survey-preview";
import Treinamentos from "@/pages/treinamentos";
import TrainingSurvey from "@/pages/treinamento";
import RhUsuarios from "@/pages/rh-usuarios";
import AdminUsuarios from "@/pages/admin-usuarios";
import PesquisasCorporativas from "@/pages/pesquisas-corporativas";
import PesquisaCorporativaPublica from "@/pages/pesquisa-corporativa";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  // global rh_admin (tenantId === null) can access admin routes; tenant-scoped rh_admin cannot
  if (user?.role === 'viewer' || user?.role === 'operator_forms' || (user?.role === 'rh_admin' && !!user?.tenantId)) return <Navigate to={ROUTES.home} replace />;
  return <>{children}</>;
}

function HoldingAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  if (user?.role !== 'holding_admin') return <Navigate to={ROUTES.home} replace />;
  return <>{children}</>;
}

function RhRoute({ children, requireGlobal }: { children: React.ReactNode; requireGlobal?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  if (user?.role !== 'rh_admin') return <Navigate to={ROUTES.login} replace />;
  if (requireGlobal && user?.tenantId) return <Navigate to={ROUTES.treinamentos(user.tenantSlug ?? '')} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Protected — nurse operates these */}
      <Route path="/:tenantSlug/pesquisa" element={<ProtectedRoute><Pesquisa /></ProtectedRoute>} />
      <Route path="/:tenantSlug/:formSlug" element={<ProtectedRoute><SurveyForm3 /></ProtectedRoute>} />

      {/* Training — RH manages sessions; public survey link */}
      <Route path="/treinamentos" element={<RhRoute><Treinamentos /></RhRoute>} />
      <Route path="/:tenantSlug/treinamentos" element={<RhRoute><Treinamentos /></RhRoute>} />
      <Route path="/:tenantSlug/treinamento/:sessionSlug" element={<TrainingSurvey />} />

      {/* Pesquisas Corporativas — gestão (RH) e formulário público */}
      <Route path="/:tenantSlug/pesquisas-corporativas" element={<RhRoute><PesquisasCorporativas /></RhRoute>} />
      <Route path="/:tenantSlug/pesquisa-corporativa/:pesquisaSlug" element={<PesquisaCorporativaPublica />} />

      {/* RH Users — only global rh_admin (no tenantId) */}
      <Route path="/rh/usuarios" element={<RhRoute requireGlobal><RhUsuarios /></RhRoute>} />

      {/* Admin Users — only holding_admin */}
      <Route path="/admin/usuarios" element={<HoldingAdminRoute><AdminUsuarios /></HoldingAdminRoute>} />

      {/* Admin only */}
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route
        path="/:tenantSlug/analytics"
        element={<AdminRoute><Analytics3 /></AdminRoute>}
      />
      <Route
        path="/:tenantSlug/responses/:id"
        element={<AdminRoute><Form3Preview /></AdminRoute>}
      />

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const path = location.pathname;

  // Survey pages: two-segment paths that are not admin pages or training
  const isSurvey =
    /^\/[^/]+\/[^/]+$/.test(path) &&
    !path.endsWith("/analytics") &&
    !path.endsWith("/pesquisa") &&
    !path.endsWith("/treinamentos") &&
    !path.endsWith("/pesquisas-corporativas") &&
    !path.includes("/responses/") &&
    !path.includes("/treinamento/") &&
    !path.includes("/pesquisa-corporativa/");

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={isSurvey ? { background: "#f4f6f9" } : undefined}
    >
      <Header />
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
