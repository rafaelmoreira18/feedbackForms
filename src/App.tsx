import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { ROUTES } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
import Header from "./components/header";
import Home from "./pages/home";
import Login from "./pages/login";
import SurveyForm3 from "./pages/survey-form3";
import Pesquisa from "./pages/pesquisa";
import Dashboard from "./pages/dashboard";
import Analytics3 from "./pages/analytics3";
import Form3Preview from "./pages/form3-preview";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Protected — nurse operates these */}
      <Route path="/:tenantSlug/pesquisa" element={<ProtectedRoute><Pesquisa /></ProtectedRoute>} />
      <Route path="/:tenantSlug/:formSlug" element={<ProtectedRoute><SurveyForm3 /></ProtectedRoute>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route
        path="/:tenantSlug/analytics"
        element={<ProtectedRoute><Analytics3 /></ProtectedRoute>}
      />
      <Route
        path="/:tenantSlug/responses/:id"
        element={<ProtectedRoute><Form3Preview /></ProtectedRoute>}
      />

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const path = location.pathname;

  // Survey pages: two-segment paths that are not analytics, pesquisa, or response detail
  const isSurvey =
    /^\/[^/]+\/[^/]+$/.test(path) &&
    !path.endsWith("/analytics") &&
    !path.endsWith("/pesquisa") &&
    !path.includes("/responses/");

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
