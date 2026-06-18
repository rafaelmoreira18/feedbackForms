import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth-context";
import { protocoloUsersService } from "@/services/protocolo-users.service";
import type { CreateProtocoloUserPayload } from "@/services/protocolo-users.service";
import type { ProtocoloUser } from "@/types";
import Text from "@/components/ui/text";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Plus, KeyRound, Power } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  protocolo_operador: "Operador",
  protocolo_medico: "Médico",
  protocolo_admin: "Admin da unidade",
  protocolo_admin_global: "Admin global",
};

/** Perfis que preenchem etapas — exigem registro profissional (CRM/COREN). */
const ROLES_COM_REGISTRO = ["protocolo_operador", "protocolo_medico"];

export default function ProtocolosUsuarios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isGlobal = user?.role === "protocolo_admin_global" || user?.role === "holding_admin";
  const [showCreate, setShowCreate] = useState(false);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["protocolo-usuarios"],
    queryFn: protocoloUsersService.getAll,
  });

  const resetPwd = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) => protocoloUsersService.resetPassword(id, pwd),
    onSuccess: () => toast.success("Senha redefinida. O usuário trocará no próximo acesso."),
    onError: () => toast.error("Erro ao redefinir senha."),
  });

  const toggleActive = useMutation({
    mutationFn: (u: ProtocoloUser) => protocoloUsersService.setActive(u.id, !u.ativo),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["protocolo-usuarios"] }); },
    onError: () => toast.error("Erro ao atualizar usuário."),
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Text variant="heading-md" className="text-gray-400">Usuários — Protocolos</Text>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={18} /> Novo usuário</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-base border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <Card shadow="sm"><div className="py-12 text-center"><Text className="text-gray-300">Nenhum usuário ainda.</Text></div></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {usuarios.map((u) => (
              <Card key={u.id} shadow="sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Text variant="body-md-bold" className={`block truncate ${u.ativo ? "text-gray-400" : "text-gray-300 line-through"}`}>
                      {u.nome}
                    </Text>
                    <Text variant="caption" className="text-gray-300">
                      {u.username ?? u.email} · {ROLE_LABEL[u.role] ?? u.role}
                      {u.registroProfissional ? ` · ${u.registroProfissional}` : ""}
                      {u.tenantNome ? ` · ${u.tenantNome}` : isGlobal && u.role === "protocolo_admin_global" ? " · Todas as unidades" : ""}
                    </Text>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Redefinir senha"
                      onClick={() => {
                        const pwd = prompt(`Nova senha para ${u.nome} (mín. 8 caracteres):`);
                        if (pwd && pwd.length >= 8) resetPwd.mutate({ id: u.id, pwd });
                        else if (pwd) toast.error("Senha muito curta.");
                      }}
                      className="p-2 rounded-lg text-teal-base hover:bg-teal-light transition-colors"
                    >
                      <KeyRound size={18} />
                    </button>
                    <button
                      type="button"
                      title={u.ativo ? "Desativar" : "Ativar"}
                      onClick={() => toggleActive.mutate(u)}
                      className={`p-2 rounded-lg transition-colors ${u.ativo ? "text-red-base hover:bg-red-base/10" : "text-green-base hover:bg-green-base/10"}`}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal isGlobal={isGlobal} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateUserModal({ isGlobal, onClose }: { isGlobal: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<CreateProtocoloUserPayload["role"]>("protocolo_operador");
  const [registroProfissional, setRegistroProfissional] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState("");

  const exigeRegistro = ROLES_COM_REGISTRO.includes(role);

  const { data: tenants = [] } = useQuery({
    queryKey: ["protocolo-usuarios-tenants"],
    queryFn: protocoloUsersService.getTenants,
    enabled: isGlobal,
  });

  // Não oferecer a matriz (Mediall Sede) nem a UPA genérica vazia na criação de usuário.
  const unidades = tenants.filter((t) => t.slug !== "mediall-goiania" && t.slug !== "upa");

  const create = useMutation({
    mutationFn: () =>
      protocoloUsersService.create({
        nome: nome.trim(),
        username: username.trim(),
        senha,
        role,
        registroProfissional: exigeRegistro ? registroProfissional.trim() : undefined,
        tenantId: role === "protocolo_admin_global" ? undefined : tenantId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocolo-usuarios"] });
      toast.success("Usuário criado. Senha temporária definida.");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Erro ao criar usuário.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !username.trim() || senha.length < 8) {
      setError("Preencha nome, usuário e senha (mín. 8 caracteres).");
      return;
    }
    if (exigeRegistro && !registroProfissional.trim()) {
      setError("Informe o registro profissional (CRM para médico, COREN para operador).");
      return;
    }
    if (role !== "protocolo_admin_global" && isGlobal && !tenantId) {
      setError("Selecione a unidade.");
      return;
    }
    setError("");
    create.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <Text as="h2" variant="heading-sm" className="text-gray-400">Novo usuário — Protocolos</Text>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input label="Usuário (login) *" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="ex.: maria.protocolo" />
          <Input label="Senha temporária *" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />

          <Select
            label="Perfil"
            options={
              isGlobal
                ? [
                    { value: "protocolo_operador", label: "Operador" },
                    { value: "protocolo_medico", label: "Médico" },
                    { value: "protocolo_admin", label: "Admin da unidade" },
                  ]
                : [
                    { value: "protocolo_operador", label: "Operador" },
                    { value: "protocolo_medico", label: "Médico" },
                  ]
            }
            value={role}
            onChange={(e) => setRole(e.target.value as CreateProtocoloUserPayload["role"])}
          />

          {exigeRegistro && (
            <Input
              label={`Registro profissional (${role === "protocolo_medico" ? "CRM" : "COREN"}) *`}
              value={registroProfissional}
              onChange={(e) => setRegistroProfissional(e.target.value)}
              placeholder={role === "protocolo_medico" ? "ex.: CRM/GO 12345" : "ex.: COREN/GO 123456"}
            />
          )}

          {isGlobal && role !== "protocolo_admin_global" && (
            <Select
              label="Unidade *"
              options={[{ value: "", label: "Selecione..." }, ...unidades.map((t) => ({ value: t.id, label: t.nome }))]}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          )}

          {!isGlobal && (
            <Text variant="caption" className="text-gray-300">O usuário será criado na sua unidade.</Text>
          )}

          {error && <Text variant="body-sm" className="text-red-base">{error}</Text>}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
