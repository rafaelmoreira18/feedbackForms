import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import Header from "./components/header";
import Home from "./pages/home";
import Login from "./pages/login";
import SurveyForm from "./pages/survey-form";
import SurveyForm2 from "./pages/survey-form2";
import Dashboard from "./pages/dashboard";
import Analytics from "./pages/analytics";
import FormPreview from "./pages/form-preview";
import Form2Preview from "./pages/form2-preview";
import Analytics2 from "./pages/analytics2";

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
      <Route path="/survey" element={<SurveyForm />} />
      <Route path="/survey2" element={<SurveyForm2 />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics2"
        element={
          <ProtectedRoute>
            <Analytics2 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form/:id"
        element={
          <ProtectedRoute>
            <FormPreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form2/:id"
        element={
          <ProtectedRoute>
            <Form2Preview />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
