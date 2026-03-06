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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pesquisa" element={<Pesquisa />} />
      <Route path="/internacao" element={<SurveyForm3 />} />
      <Route path="/exames" element={<SurveyForm3 />} />
      <Route path="/ambulatorio" element={<SurveyForm3 />} />
      <Route path="/uti" element={<SurveyForm3 />} />
      <Route path="/pronto-socorro" element={<SurveyForm3 />} />
      <Route path="/hemodialise" element={<SurveyForm3 />} />
      <Route path="/centro-cirurgico" element={<SurveyForm3 />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics3"
        element={
          <ProtectedRoute>
            <Analytics3 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form3/:id"
        element={
          <ProtectedRoute>
            <Form3Preview />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const SURVEY_PATHS = [
  "/pesquisa",
  "/internacao", "/exames", "/ambulatorio",
  "/uti", "/pronto-socorro", "/hemodialise", "/centro-cirurgico",
];

function AppShell() {
  const location = useLocation();
  const isSurvey = SURVEY_PATHS.some((p) => location.pathname === p);

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
