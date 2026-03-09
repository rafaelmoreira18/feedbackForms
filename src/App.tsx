import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/auth-context";
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
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/:tenantSlug/pesquisa" element={<Pesquisa />} />

      {/**
       * Multi-tenant survey: /:tenantSlug/:formSlug
       * Example: /hospital-sao-lucas/internacao
       */}
      <Route path="/:tenantSlug/:formSlug" element={<SurveyForm3 />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const path = location.pathname;
  // Survey background: two-segment paths that are not analytics or response detail
  const isSurvey =
    /^\/[^/]+\/[^/]+$/.test(path) &&
    !path.endsWith("/analytics") &&
    !path.includes("/responses/");

  return (
    <div
      className={isSurvey ? "min-h-screen" : ""}
      style={isSurvey ? { background: "#f4f6f9" } : undefined}
    >
      <Header />
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
