import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { KeyRound, UserX, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  adminUsersService,
  type AdminUser,
  type CreateAdminUserInput,
} from "@/services/admin-users.service";
import type { Tenant } from "@/types";
import { ROUTES } from "@/routes";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  operator_forms: "Operador",
  tenant_admin: "Admin de Unidade",
  super_admin: "Admin Global",
};

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  operator_forms: { background: "#dbeafe", color: "#1d4ed8" },
  tenant_admin:   { background: "#ede9fe", color: "#6d28d9" },
  super_admin:    { background: "#ffedd5", color: "#c2410c" },
};

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
      await adminUsersService.resetPassword(userId, form.newPassword);
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
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-400 hover:bg-gray-100 transition-colors">
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="text-4xl">✅</span>
              <Text variant="body-md" className="text-gray-400">Senha redefinida com sucesso.</Text>
              <Text variant="body-sm" className="text-gray-300">
                <strong>{userName}</strong> deverá alterar a senha no próximo acesso.
              </Text>
              <Button className="w-full mt-2" onClick={handleClose}>Fechar</Button>
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
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
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

// ─── Modal Criar Usuário ──────────────────────────────────────────────────────

interface ModalCriarProps {
  open: boolean;
  tenants: Tenant[];
  isGlobal: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function ModalCriarUsuario({ open, tenants, isGlobal, onClose, onCreated }: ModalCriarProps) {
  const [form, setForm] = useState<CreateAdminUserInput>({
    nome: "", username: "", senha: "", role: "operator_forms", tenantId: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateAdminUserInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const reset = useCallback(() => {
    setForm({ nome: "", username: "", senha: "", role: "operator_forms", tenantId: "" });
    setErrors({});
    setServerError("");
  }, []);

  function validate(): boolean {
    const e: Partial<Record<keyof CreateAdminUserInput, string>> = {};
    if (form.nome.trim().length < 2) e.nome = "Nome deve ter ao menos 2 caracteres";
    if (form.username.trim().length < 3) e.username = "Usuário deve ter ao menos 3 caracteres";
    if (!/^[a-z0-9._-]+$/.test(form.username)) e.username = "Apenas letras minúsculas, números, ponto, hífen e underscore";
    if (form.senha.length < 8) e.senha = "Senha deve ter ao menos 8 caracteres";
    // hospital_admin: backend define o tenantId; só valida quando é global e o role exige tenant
    if (isGlobal && form.role !== "super_admin" && !form.tenantId) e.tenantId = "Selecione uma unidade";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const input: CreateAdminUserInput = {
        nome: form.nome.trim(),
        username: form.username.trim().toLowerCase(),
        senha: form.senha,
        role: form.role,
        tenantId: form.role !== "super_admin" && form.tenantId ? form.tenantId : undefined,
      };
      await adminUsersService.create(input);
      reset();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setServerError(
        msg.includes("409") || msg.toLowerCase().includes("já cadastrado")
          ? "Nome de usuário já cadastrado"
          : "Erro ao criar usuário. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const needsTenant = form.role !== "super_admin";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <Text as="h2" variant="heading-sm" className="text-gray-400">Novo Usuário</Text>
          <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-400 hover:bg-gray-100 transition-colors">
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
            placeholder="ex: admin.unidade"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, '').toLowerCase() }))}
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

          {/* Função */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-400 font-sans">Função</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as CreateAdminUserInput["role"], tenantId: "" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-base transition-all"
            >
              <option value="operator_forms">Operador</option>
              <option value="tenant_admin">Admin de Unidade</option>
              {isGlobal && <option value="super_admin">Admin Global</option>}
            </select>
          </div>

          {/* Unidade — apenas para holding_admin e roles que exigem tenant */}
          {isGlobal && needsTenant && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-400 font-sans">Unidade</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border bg-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-base transition-all ${errors.tenantId ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">Selecione uma unidade</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.tenantId && <span className="text-xs text-red-500">{errors.tenantId}</span>}
            </div>
          )}

          {serverError && (
            <Text variant="body-sm" className="text-red-base bg-red-50 px-3 py-2 rounded-lg">
              {serverError}
            </Text>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Confirmar Desativar/Ativar ─────────────────────────────────────────

interface ToggleAtivoModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ModalToggleAtivo({ user, onClose, onConfirm, loading }: ToggleAtivoModalProps) {
  if (!user) return null;
  const ativando = !user.ativo;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <Text as="h2" variant="heading-sm" className="text-gray-400">
            {ativando ? "Ativar usuário" : "Desativar usuário"}
          </Text>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <Text variant="body-sm" className="text-gray-400">
            {ativando
              ? <>Deseja ativar o usuário <strong>{user.nome}</strong>? Ele poderá acessar o sistema novamente.</>
              : <>Deseja desativar o usuário <strong>{user.nome}</strong>? Ele não poderá mais fazer login.</>
            }
          </Text>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className={`flex-1 ${ativando ? "" : "bg-red-500 hover:bg-red-600 border-red-500"}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Aguarde..." : ativando ? "Ativar" : "Desativar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function AdminUsuarios() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isGlobal = user?.role === "holding_admin";

  // hospital_admin: escopo fixo na própria unidade — sem seletor
  const [selectedTenantId, setSelectedTenantId] = useState(isGlobal ? "" : (user?.tenantId ?? ""));

  const [modalOpen, setModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: adminUsersService.listTenants,
    enabled: isGlobal,
  });

  const { data: usuarios = [], isLoading: usuariosLoading } = useQuery({
    queryKey: ["admin-usuarios", selectedTenantId],
    queryFn: () => adminUsersService.listByTenant(selectedTenantId === "global" ? "global" : selectedTenantId),
    enabled: !!selectedTenantId,
  });

  const reload = () => queryClient.invalidateQueries({ queryKey: ["admin-usuarios", selectedTenantId] });

  const toggleMutation = useMutation({
    mutationFn: () => adminUsersService.toggleAtivo(toggleTarget!.id, !toggleTarget!.ativo),
    onSuccess: () => {
      setToggleTarget(null);
      reload();
    },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="text-sm text-gray-300 hover:text-gray-400 transition-colors"
          >
            ← Dashboard
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Text variant="body-sm" className="text-gray-300 hidden sm:block">{user?.name}</Text>
          <Button variant="secondary" size="sm" onClick={logout}>Sair</Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Título */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-base flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <Text as="h1" variant="heading-sm" className="text-gray-400 block">
                Usuários do Sistema
              </Text>
              <Text variant="body-sm" className="text-gray-300 block">
                {isGlobal ? "Gerencie operadores e administradores" : "Usuários da sua unidade"}
              </Text>
            </div>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)} disabled={isGlobal ? tenantsLoading : false}>
            + Novo Usuário
          </Button>
        </div>

        {/* Filtro de Unidade — apenas para holding_admin */}
        {isGlobal && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 font-sans mb-1.5">
              Selecione a unidade
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full sm:w-80 px-4 py-3 rounded-xl border border-gray-200 bg-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-base transition-all text-gray-400"
            >
              <option value="">— Selecione uma unidade —</option>
              <option value="global">🌐 Admins Globais</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado vazio — holding_admin sem unidade selecionada */}
        {isGlobal && !selectedTenantId && (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Users size={36} className="text-gray-200" />
              <Text variant="body-md" className="text-gray-300">
                Selecione uma unidade ou "Admins Globais" para ver os usuários.
              </Text>
            </div>
          </Card>
        )}

        {/* Loading */}
        {selectedTenantId && usuariosLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Lista vazia */}
        {selectedTenantId && !usuariosLoading && usuarios.length === 0 && (
          <Card shadow="sm">
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Users size={36} className="text-gray-200" />
              <Text variant="body-md" className="text-gray-300">
                Nenhum usuário cadastrado nesta unidade.
              </Text>
            </div>
          </Card>
        )}

        {/* Lista */}
        {selectedTenantId && !usuariosLoading && usuarios.length > 0 && (
          <div className="flex flex-col gap-3">
            {usuarios.map((u) => (
              <Card key={u.id} shadow="sm">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${u.ativo ? "bg-teal-base/10" : "bg-gray-100"}`}>
                    <span className={`text-sm font-bold ${u.ativo ? "text-teal-base" : "text-gray-300"}`}>
                      {u.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Text variant="body-sm-bold" className={`block truncate ${u.ativo ? "text-gray-400" : "text-gray-300 line-through"}`}>
                      {u.nome}
                    </Text>
                    <Text variant="caption" className="text-gray-300 block truncate">
                      {u.username ?? u.email.split('@')[0]}
                    </Text>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs font-semibold font-sans px-2 py-0.5 rounded"
                        style={ROLE_STYLES[u.role] ?? { background: "#f3f4f6", color: "#6b7280" }}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <span className={`text-xs font-sans px-1.5 py-0.5 rounded ${u.ativo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {u.ativo ? "ativo" : "inativo"}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      title="Redefinir senha"
                      onClick={() => setResetTarget(u)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-teal-base hover:bg-teal-light transition-colors"
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      title={u.ativo ? "Desativar usuário" : "Ativar usuário"}
                      onClick={() => setToggleTarget(u)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${u.ativo ? "text-gray-300 hover:text-red-500 hover:bg-red-50" : "text-gray-300 hover:text-green-600 hover:bg-green-50"}`}
                    >
                      {u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ModalCriarUsuario
        open={modalOpen}
        tenants={tenants}
        isGlobal={isGlobal}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
      />

      <ModalResetarSenha
        open={resetTarget !== null}
        userId={resetTarget?.id ?? ""}
        userName={resetTarget?.nome ?? ""}
        onClose={() => setResetTarget(null)}
      />

      <ModalToggleAtivo
        user={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleMutation.mutate()}
        loading={toggleMutation.isPending}
      />
    </div>
  );
}
