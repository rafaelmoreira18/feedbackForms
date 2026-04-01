import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Already logged in → redirect by role
  if (isAuthenticated && user) {
    if (user.mustChangePassword) return <Navigate to={ROUTES.changePassword} replace />;
    const slug = user.tenantSlug ?? '';
    const dest =
      (user.role === 'viewer' || user.role === 'operator_forms') ? ROUTES.pesquisa(slug) :
      user.role === 'rh_admin' ? (slug ? ROUTES.treinamentos(slug) : ROUTES.treinamentosGlobal) :
      ROUTES.dashboard;
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        if (loggedUser.mustChangePassword) {
          navigate(ROUTES.changePassword);
          return;
        }
        const slug = loggedUser.tenantSlug ?? '';
        const dest =
          (loggedUser.role === 'viewer' || loggedUser.role === 'operator_forms') ? ROUTES.pesquisa(slug) :
          loggedUser.role === 'rh_admin' ? (slug ? ROUTES.treinamentos(slug) : ROUTES.treinamentosGlobal) :
          ROUTES.dashboard;
        navigate(dest);
      } else {
        setError("Email ou senha incorretos");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md" shadow="md">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <Text as="h1" variant="heading-md" className="text-gray-400 mb-2">
              Sistema de Pesquisa
            </Text>
            <Text variant="body-md" className="text-gray-300">
              Pesquisa de Satisfação Hospitalar
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email ou usuário"
              type="text"
              placeholder="seu@email.com ou rh.usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <Text variant="body-sm" className="text-red-base text-center">
                {error}
              </Text>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

        </div>
      </Card>
    </div>
  );
}