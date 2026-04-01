import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
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

      {/* RH Users — only global rh_admin (no tenantId) */}
      <Route path="/rh/usuarios" element={<RhRoute requireGlobal><RhUsuarios /></RhRoute>} />

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
    !path.includes("/responses/") &&
    !path.includes("/treinamento/");

  return (
    <div
      className="min-h-screen"
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
