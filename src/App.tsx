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
import Login from "@/pages/auth/login";
import ChangePassword from "@/pages/auth/change-password";
import SurveyForm3 from "@/pages/paciente/survey";
import Pesquisa from "@/pages/paciente/pesquisa";
import Dashboard from "@/pages/paciente/dashboard";
import Analytics3 from "@/pages/paciente/analytics";
import Form3Preview from "@/pages/paciente/survey/survey-preview";
import RhHub from "@/pages/rh/hub";
import TrainingSurvey from "@/pages/rh/treinamento";
import RhUsuarios from "@/pages/rh/rh-usuarios";
import AdminUsuarios from "@/pages/admin/admin-usuarios";
import PesquisaCorporativaPublica from "@/pages/rh/pesquisa-corporativa";
import AvaliacaoDesempenhoPublica from "@/pages/rh/avaliacao-desempenho";
import PdiDesenvolvimentoPublica from "@/pages/rh/pdi-desenvolvimento";
import AvaliacaoPlayground from "@/pages/dev/avaliacao-playground";
import ProtocolosHome from "@/pages/protocolos";
import ProtocoloForm from "@/pages/protocolos/form";
import ProtocolosDashboard from "@/pages/protocolos/dashboard";
import ProtocolosUsuarios from "@/pages/protocolos/usuarios";
import ProtocolosConcluidos from "@/pages/protocolos/concluidos";

const MOCK_PERF = import.meta.env.VITE_MOCK_PERF === "true";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  // global rh_admin (tenantId === null) can access admin routes; tenant-scoped rh_admin cannot
  if (user?.role === 'viewer' || user?.role === 'operator_forms' || user?.role === 'rh_admin') return <Navigate to={ROUTES.rhHubGlobal} replace />;
  return <>{children}</>;
}

function HoldingAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  if (user?.role !== 'holding_admin') return <Navigate to={ROUTES.home} replace />;
  return <>{children}</>;
}

const PROTOCOLO_ROLES = [
  'protocolo_operador',
  'protocolo_admin',
  'protocolo_admin_global',
  'holding_admin',
] as const;

function ProtocoloRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  const role = user?.role;
  if (!role || !(PROTOCOLO_ROLES as readonly string[]).includes(role)) {
    return <Navigate to={ROUTES.login} replace />;
  }
  // Operador não acessa dashboard nem gestão de usuários
  if (adminOnly && role === 'protocolo_operador') {
    return <Navigate to={ROUTES.protocolos(user?.tenantSlug ?? undefined)} replace />;
  }
  return <>{children}</>;
}

// Pesquisas de satisfação não devem ser vistas por perfis de protocolo
function PesquisaRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  const role = user?.role;
  if (role && (PROTOCOLO_ROLES as readonly string[]).includes(role) && role !== 'holding_admin') {
    return <Navigate to={ROUTES.protocolos(user?.tenantSlug ?? undefined)} replace />;
  }
  return <>{children}</>;
}

function RhRoute({ children, requireGlobal }: { children: React.ReactNode; requireGlobal?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
  if (user?.role !== 'rh_admin' && user?.role !== 'holding_admin') return <Navigate to={ROUTES.login} replace />;
  if (requireGlobal && user?.tenantId) return <Navigate to={ROUTES.rhHub(user.tenantSlug ?? '')} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* RH Hub — all RH management lives here */}
      <Route path="/rh-hub" element={<RhRoute><RhHub /></RhRoute>} />
      <Route path="/:tenantSlug/rh-hub" element={<RhRoute><RhHub /></RhRoute>} />

      {/* Protected — nurse operates these (perfis de protocolo são barrados) */}
      <Route path="/:tenantSlug/pesquisa" element={<PesquisaRoute><Pesquisa /></PesquisaRoute>} />
      <Route path="/:tenantSlug/:formSlug" element={<PesquisaRoute><SurveyForm3 /></PesquisaRoute>} />

      {/* Training — public survey link only; management is via rh-hub */}
      <Route path="/:tenantSlug/treinamento/:sessionSlug" element={<TrainingSurvey />} />

      {/* Pesquisas Corporativas — public form only; management is via rh-hub */}
      <Route path="/:tenantSlug/pesquisa-corporativa/:pesquisaSlug" element={<PesquisaCorporativaPublica />} />

      {/* Avaliação de Desempenho — public link only; management is via rh-hub */}
      <Route path="/:tenantSlug/avaliacao-desempenho/:slug" element={<AvaliacaoDesempenhoPublica />} />

      {/* PDI — Plano de Desenvolvimento Individual — public link only; management is via rh-hub */}
      <Route path="/:tenantSlug/pdi-desenvolvimento/:slug" element={<PdiDesenvolvimentoPublica />} />

      {/* Dev playground — só com VITE_MOCK_PERF=true (testa o fluxo sem backend) */}
      {MOCK_PERF && (
        <Route path="/dev/avaliacoes" element={<AvaliacaoPlayground />} />
      )}

      {/* Protocolos (Protocolo de Dor Torácica) — aba gateada por papel */}
      <Route path="/protocolos" element={<ProtocoloRoute><ProtocolosHome /></ProtocoloRoute>} />
      <Route path="/:tenantSlug/protocolos" element={<ProtocoloRoute><ProtocolosHome /></ProtocoloRoute>} />
      <Route path="/:tenantSlug/protocolos/:slug" element={<ProtocoloRoute><ProtocoloForm /></ProtocoloRoute>} />
      <Route path="/protocolos-dashboard" element={<ProtocoloRoute adminOnly><ProtocolosDashboard /></ProtocoloRoute>} />
      <Route path="/:tenantSlug/protocolos-dashboard" element={<ProtocoloRoute adminOnly><ProtocolosDashboard /></ProtocoloRoute>} />
      <Route path="/protocolos-usuarios" element={<ProtocoloRoute adminOnly><ProtocolosUsuarios /></ProtocoloRoute>} />
      <Route path="/:tenantSlug/protocolos-usuarios" element={<ProtocoloRoute adminOnly><ProtocolosUsuarios /></ProtocoloRoute>} />
      <Route path="/protocolos-concluidos" element={<ProtocoloRoute adminOnly><ProtocolosConcluidos /></ProtocoloRoute>} />
      <Route path="/:tenantSlug/protocolos-concluidos" element={<ProtocoloRoute adminOnly><ProtocolosConcluidos /></ProtocoloRoute>} />

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
    !path.includes("/pesquisa-corporativa/") &&
    !path.includes("/avaliacao-desempenho/") &&
    !path.includes("/pdi-desenvolvimento/") &&
    !path.includes("/protocolos");

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
