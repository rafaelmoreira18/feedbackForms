import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import Text from "../components/text";
import Input from "../components/input";
import Button from "../components/button";
import Card from "../components/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
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
              label="Email"
              type="email"
              placeholder="seu@email.com"
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

          <div className="border-t border-gray-200 pt-4">
            <Text variant="body-sm" className="text-gray-300 text-center">
              Credenciais de teste:
            </Text>
            <Text variant="caption" className="text-gray-300 text-center block mt-1">
              Email: admin@hospital.com | Senha: admin123
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}