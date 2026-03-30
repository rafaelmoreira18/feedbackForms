import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { rhUsersService, type CreateRhUserInput } from "@/services/rh-users.service";
import { api } from "@/services/api";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

// ─── Modal Resetar Senha ──────────────────────────────────────────────────────

interface ResetPasswordModalProps {
  open: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

function ModalResetarSenha({ open, userId, userName, onClose }: ResetPasswordModalProps) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setForm({ newPassword: "", confirmPassword: "" });
    setErrors({});
    setServerError("");
    setSuccess(false);
  }, []);

  function validate(): boolean {
    const e: Partial<typeof form> = {};
    if (form.newPassword.length < 8) e.newPassword = "Mínimo 8 caracteres";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      await api.post(`rh/usuarios/${userId}/reset-password`, { newPassword: form.newPassword });
      setSuccess(true);
    } catch {
      setServerError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <Text as="h2" variant="heading-sm" className="text-gray-400">
            Redefinir Senha
          </Text>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="text-4xl">✅</span>
              <Text variant="body-md" className="text-gray-400">
                Senha redefinida com sucesso.
              </Text>
              <Text variant="body-sm" className="text-gray-300">
                <strong>{userName}</strong> deverá alterar a senha no próximo acesso.
              </Text>
              <Button className="w-full mt-2" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Text variant="body-sm" className="text-gray-300">
                Defina uma senha temporária para <strong className="text-gray-400">{userName}</strong>.
                O usuário será obrigado a alterá-la no próximo acesso.
              </Text>

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
                <Text variant="body-sm" className="text-red-base bg-red-50 px-3 py-2 rounded-lg">
                  {serverError}
                </Text>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Criar Usuário RH ───────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function ModalCriarUsuarioRh({ open, onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({ nome: "", username: "", senha: "", tenantId: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: tenants = [] } = useQuery({
    queryKey: ["rh-tenants"],
    queryFn: rhUsersService.listTenants,
    enabled: open,
  });

  const reset = useCallback(() => {
    setForm({ nome: "", username: "", senha: "", tenantId: "" });
    setErrors({});
    setServerError("");
  }, []);

  function validate(): boolean {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (form.nome.trim().length < 2) e.nome = "Nome deve ter ao menos 2 caracteres";
    if (form.username.trim().length < 3) e.username = "Usuário deve ter ao menos 3 caracteres";
    if (!/^[a-z0-9._-]+$/.test(form.username)) e.username = "Apenas letras minúsculas, números, ponto, hífen e underscore";
    if (form.senha.length < 8) e.senha = "Senha deve ter ao menos 8 caracteres";
    if (!form.tenantId) e.tenantId = "Selecione uma unidade";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const input: CreateRhUserInput = {
        nome: form.nome.trim(),
        username: form.username.trim().toLowerCase(),
        senha: form.senha,
        tenantId: form.tenantId,
      };
      await rhUsersService.create(input);
      reset();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setServerError(msg.includes("409") || msg.toLowerCase().includes("já cadastrado")
        ? "Nome de usuário já cadastrado"
        : "Erro ao criar usuário. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <Text as="h2" variant="heading-sm" className="text-gray-400">
            Criar Usuário RH
          </Text>
          <button
            onClick={() => { reset(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <Input
            label="Nome completo"
            placeholder="Nome do usuário"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
          />

          <Input
            label="Nome de usuário"
            placeholder="ex: rh.hrgm"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
            error={errors.username}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
            error={errors.senha}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-400 font-sans">
              Unidade
            </label>
            <select
              value={form.tenantId}
              onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border bg-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-base transition-all ${errors.tenantId ? "border-red-400" : "border-gray-200"}`}
            >
              <option value="">Selecione uma unidade</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            {errors.tenantId && (
              <span className="text-xs text-red-500">{errors.tenantId}</span>
            )}
          </div>

          {serverError && (
            <Text variant="body-sm" className="text-red-base bg-red-50 px-3 py-2 rounded-lg">
              {serverError}
            </Text>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function RhUsuarios() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; nome: string } | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["rh-usuarios"],
    queryFn: rhUsersService.list,
  });

  const reload = () => queryClient.invalidateQueries({ queryKey: ["rh-usuarios"] });

  const backRoute = user?.tenantSlug
    ? ROUTES.treinamentos(user.tenantSlug)
    : ROUTES.treinamentosGlobal;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backRoute)}
            className="text-sm text-gray-300 hover:text-gray-400 transition-colors"
          >
            ← Treinamentos
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">
            {user?.name}
          </Text>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Título + botão */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-base flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
              <Text as="h1" variant="heading-sm" className="text-gray-400 block">
                Usuários RH
              </Text>
              <Text variant="body-sm" className="text-gray-300 block">
                Contas de acesso ao módulo de treinamentos
              </Text>
            </div>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Novo Usuário
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-4xl">👤</span>
              <Text variant="body-md" className="text-gray-300">
                Nenhum usuário RH cadastrado ainda.
              </Text>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {usuarios.map((u) => (
              <Card key={u.id} shadow="sm">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-teal-base/10 flex items-center justify-center shrink-0">
                    <span className="text-teal-base text-sm font-bold">
                      {u.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text variant="body-sm-bold" className="text-gray-400 block truncate">
                      {u.nome}
                    </Text>
                    <Text variant="caption" className="text-gray-300 block">
                      {u.email}
                    </Text>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-teal-base/10 text-teal-base">
                        RH
                      </span>
                      {u.tenantNome ? (
                        <span className="text-xs text-gray-300 font-mono">
                          /{u.tenantSlug} — {u.tenantNome}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">Acesso global</span>
                      )}
                      <span className={`text-xs font-sans px-1.5 py-0.5 rounded ${u.ativo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {u.ativo ? "ativo" : "inativo"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetTarget({ id: u.id, nome: u.nome })}
                  >
                    Redefinir senha
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ModalCriarUsuarioRh
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
      />

      <ModalResetarSenha
        open={resetTarget !== null}
        userId={resetTarget?.id ?? ""}
        userName={resetTarget?.nome ?? ""}
        onClose={() => setResetTarget(null)}
      />
    </div>
  );
}
