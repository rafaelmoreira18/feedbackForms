import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/services/api";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

export default function ChangePassword() {
  const { user, clearMustChangePassword } = useAuth();
  const navigate = useNavigate();

  const isForced = !!user?.mustChangePassword;

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Partial<typeof form> = {};
    if (!isForced && !form.currentPassword) e.currentPassword = "Informe a senha atual";
    if (form.newPassword.length < 8) e.newPassword = "Mínimo 8 caracteres";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    try {
      await api.post("auth/change-password", {
        ...(isForced ? {} : { currentPassword: form.currentPassword }),
        newPassword: form.newPassword,
      });

      clearMustChangePassword();

      // Redirect to the appropriate page based on role
      const slug = user?.tenantSlug ?? "";
      const dest =
        user?.role === "viewer"
          ? ROUTES.pesquisa(slug)
          : user?.role === "rh_admin"
          ? slug
            ? ROUTES.treinamentos(slug)
            : ROUTES.treinamentosGlobal
          : ROUTES.dashboard;

      navigate(dest, { replace: true });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setServerError("Senha atual incorreta");
      } else {
        setServerError("Erro ao alterar senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md" shadow="md">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <Text as="h1" variant="heading-md" className="text-gray-400 mb-2">
              Alterar Senha
            </Text>
            <Text variant="body-md" className="text-gray-300">
              {user?.mustChangePassword
                ? "Por segurança, você deve definir uma nova senha antes de continuar."
                : "Defina uma nova senha para sua conta."}
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isForced && (
              <Input
                label="Senha atual"
                type="password"
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                error={errors.currentPassword}
              />
            )}

            <Input
              label="Nova senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              error={errors.newPassword}
            />

            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="Repita a nova senha"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={errors.confirmPassword}
            />

            {serverError && (
              <Text variant="body-sm" className="text-red-base text-center">
                {serverError}
              </Text>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
