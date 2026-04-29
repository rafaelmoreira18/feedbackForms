# Plano de Implementação — Roles de TI (ti_admin / ti_admin_global)

**Data:** 2026-04-22
**Projeto:** feedbackforms — Sistema de Pesquisa de Satisfação de Pacientes
**Status:** Planejamento

---

## 1. Resumo Executivo

Atualmente, a tela `/admin/usuarios` é acessível apenas por `holding_admin` e `hospital_admin`. O `hospital_admin` tem escopo limitado à própria unidade. O `holding_admin` tem acesso total.

O objetivo desta feature é adicionar dois novos perfis de TI que podem gerenciar usuários — sem serem administradores de negócio:

- **`ti_admin_global`** (banco: `ti_global`): escopo global, sem `tenantId`. Acessa qualquer unidade. Não pode criar `super_admin`.
- **`ti_admin`** (banco: `ti`): escopo de unidade, com `tenantId`. Vê apenas sua unidade. Não pode criar `super_admin`.

Adicionalmente, o `hospital_admin` passa a ser **somente leitura** nessa tela (hoje ele tem acesso a criar e editar usuários).

Nenhuma migration de schema é necessária no banco de autenticação — o campo `role` é `text` livre sem `CHECK CONSTRAINT`.

---

## 2. Diagrama de Roles — Permissões na Tela de Usuários

| Role JWT | Role banco | tenantId | Seletor unidades | Criar usuário | Editar/Resetar/Toggle | Pode criar super_admin |
|---|---|---|---|---|---|---|
| `holding_admin` | `super_admin` | NULL | Sim (todas) | Sim | Sim | **Sim** |
| `ti_admin_global` | `ti_global` | NULL | Sim (todas) | Sim | Sim | Não |
| `ti_admin` | `ti` | UUID | Não (fixo) | Sim (só na unidade) | Sim (só na unidade) | Não |
| `hospital_admin` | `tenant_admin` | UUID | Não (fixo) | **Não** (somente leitura) | **Não** | Não |
| `operator_forms` | `operator_forms` | UUID | — | — | — | — |

**Roles sem acesso à rota `/admin/usuarios`:** `operator_forms`, `viewer`, `rh_admin` scoped.

---

## 3. Passos de Implementação

### Passo 1 — Backend: Tipo `UserRole`

**Arquivo:** `backend/src/common/types/roles.ts`

```ts
export type UserRole =
  | 'holding_admin'
  | 'hospital_admin'
  | 'operator_forms'
  | 'viewer'
  | 'rh_admin'
  | 'ti_admin'
  | 'ti_admin_global';
```

---

### Passo 2 — Backend: Mapeamento no `auth.service.ts`

**Arquivo:** `backend/src/modules/auth/auth.service.ts`

Adicionar ao objeto `ROLE_MAP`:

```ts
const ROLE_MAP: Record<string, string> = {
  super_admin:    'holding_admin',
  tenant_admin:   'hospital_admin',
  operator_forms: 'operator_forms',
  operator:       'viewer',
  rh:             'rh_admin',
  ti:             'ti_admin',        // NOVO
  ti_global:      'ti_admin_global', // NOVO
};
```

Sem isso, usuários com `role = 'ti'` ou `role = 'ti_global'` no banco receberiam JWT com role `viewer` (fallback).

---

### Passo 3 — Backend: Controller `admin-users.controller.ts`

**Arquivo:** `backend/src/modules/admin-users/admin-users.controller.ts`

**3a. Decorator `@Roles()` na classe**

```ts
@Roles('holding_admin', 'hospital_admin', 'ti_admin_global', 'ti_admin')
```

**3b. Endpoint `GET /admin/usuarios`**

```ts
@Get()
find(@Query('tenantId') tenantId: string, @Request() req: { user: ReqUser }) {
  const { role, tenantId: userTenantId } = req.user;

  // Roles com escopo fixo na própria unidade
  if (role === 'hospital_admin' || role === 'ti_admin') {
    if (!userTenantId) throw new ForbiddenException('Usuário sem unidade associada');
    return this.adminUsersService.findByTenant(userTenantId);
  }

  // Roles globais: holding_admin e ti_admin_global
  if (!tenantId) throw new BadRequestException('Selecione uma unidade para listar os usuários');
  if (tenantId === 'global') return this.adminUsersService.findGlobal();
  return this.adminUsersService.findByTenant(tenantId);
}
```

**3c. Endpoint `POST /admin/usuarios` (criar)**

```ts
@Post()
create(@Body() dto: CreateAdminUserDto, @Request() req: { user: ReqUser }) {
  const { role, tenantId: userTenantId } = req.user;

  // hospital_admin: somente leitura
  if (role === 'hospital_admin') {
    throw new ForbiddenException('Sem permissão para criar usuários');
  }

  // ti_admin: escopo de unidade, não cria super_admin
  if (role === 'ti_admin') {
    if (!userTenantId) throw new ForbiddenException('Usuário sem unidade associada');
    if (dto.role === 'super_admin') throw new ForbiddenException('Sem permissão para criar Admin Global');
    return this.adminUsersService.create({ ...dto, tenantId: userTenantId });
  }

  // ti_admin_global: global, não cria super_admin
  if (role === 'ti_admin_global') {
    if (dto.role === 'super_admin') throw new ForbiddenException('Sem permissão para criar Admin Global');
    return this.adminUsersService.create(dto);
  }

  // holding_admin: acesso total
  return this.adminUsersService.create(dto);
}
```

**3d. Endpoints `POST :id/reset-password` e `PATCH :id/ativo`**

```ts
// hospital_admin bloqueado; ti_admin usa scopeTenantId
const scopeTenantId = role === 'ti_admin' ? req.user.tenantId : null;

if (role === 'hospital_admin') {
  throw new ForbiddenException('Sem permissão');
}
```

---

### Passo 4 — Backend: `admin-users.service.ts`

**Arquivo:** `backend/src/modules/admin-users/admin-users.service.ts`

**4a. Constante `SYSTEM_ROLES`** — valores são os roles **do banco**, não do JWT:

```ts
const SYSTEM_ROLES = ['operator_forms', 'tenant_admin', 'super_admin', 'ti', 'ti_global'];
```

Sem isso, usuários TI não aparecem na listagem e não podem ter senha resetada.

**4b. Método `toDbRole`**

```ts
private toDbRole(role: string): string {
  const map: Record<string, string> = {
    super_admin:     'super_admin',
    tenant_admin:    'tenant_admin',
    operator_forms:  'operator_forms',
    ti_admin:        'ti',        // NOVO
    ti_admin_global: 'ti_global', // NOVO
  };
  return map[role] ?? role;
}
```

**4c. DTO `create-admin-user.dto.ts`**

```ts
@IsIn(['operator_forms', 'tenant_admin', 'super_admin', 'ti_admin', 'ti_admin_global'])
role: 'operator_forms' | 'tenant_admin' | 'super_admin' | 'ti_admin' | 'ti_admin_global';
```

Sem atualizar o `@IsIn`, o endpoint retorna HTTP 400 ao tentar criar usuário TI — mesmo com permissão de role correta.

---

### Passo 5 — Frontend: Tipo `UserRole` em `src/types/`

**Arquivo:** Localizar o tipo `UserRole` no frontend (provavelmente `src/types/index.ts` ou `src/contexts/auth-context.tsx`):

```ts
export type UserRole =
  | 'holding_admin'
  | 'hospital_admin'
  | 'viewer'
  | 'operator_forms'
  | 'rh_admin'
  | 'ti_admin'
  | 'ti_admin_global';
```

---

### Passo 6 — Frontend: `src/App.tsx` — `AdminRoute`

A condição atual de bloqueio é uma lista de negação. As novas roles não estão nessa lista, então são permitidas automaticamente. **Nenhuma mudança obrigatória.**

Verificar se `ti_admin`/`ti_admin_global` devem acessar dashboard e analytics além de `/admin/usuarios`. Recomendação: permitir por ora.

---

### Passo 7 — Frontend: `src/pages/admin-usuarios/index.tsx`

**7a. Constante `isGlobal`**

```ts
const isGlobal =
  user?.role === "holding_admin" ||
  user?.role === "ti_admin_global";
```

**7b. Nova constante `canEdit`**

```ts
const canEdit =
  user?.role === "holding_admin" ||
  user?.role === "ti_admin_global" ||
  user?.role === "ti_admin";
// hospital_admin: canEdit = false (somente leitura)
```

**7c. Botão "Novo Usuário" — condicional**

```tsx
{canEdit && (
  <Button size="sm" onClick={() => setModalOpen(true)} ...>
    + Novo Usuário
  </Button>
)}
```

**7d. Botões de ação na lista**

```tsx
{canEdit && (
  <div className="flex items-center gap-1.5 shrink-0">
    <button title="Redefinir senha" onClick={() => setResetTarget(u)} ...>
      <KeyRound size={16} />
    </button>
    <button title={...} onClick={() => setToggleTarget(u)} ...>
      {u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
    </button>
  </div>
)}
```

**7e. `ROLE_LABELS` e `ROLE_STYLES`** — valores são os roles **do banco** (o que a API retorna):

```ts
const ROLE_LABELS: Record<string, string> = {
  operator_forms: "Operador",
  tenant_admin:   "Admin de Unidade",
  super_admin:    "Admin Global",
  ti:             "TI Unidade",  // NOVO
  ti_global:      "TI Global",   // NOVO
};

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  operator_forms: { background: "#dbeafe", color: "#1d4ed8" },
  tenant_admin:   { background: "#ede9fe", color: "#6d28d9" },
  super_admin:    { background: "#ffedd5", color: "#c2410c" },
  ti:             { background: "#d1fae5", color: "#065f46" }, // NOVO
  ti_global:      { background: "#dcfce7", color: "#14532d" }, // NOVO
};
```

**7f. Modal de criar — opções de role**

```tsx
<select value={form.role} onChange={...}>
  <option value="operator_forms">Operador</option>
  <option value="tenant_admin">Admin de Unidade</option>
  <option value="ti_admin">TI Unidade</option>
  {isGlobal && <option value="ti_admin_global">TI Global</option>}
  {user?.role === 'holding_admin' && <option value="super_admin">Admin Global</option>}
</select>
```

---

## 4. SQL Necessário

Executar no banco `Autenticacao_DB` (RDS AWS: `dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com`).

### 4.1 Gerar hash bcrypt para senha temporária

```bash
# Na pasta backend/
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SenhaTemp123!', 10).then(h => console.log(h));"
```

### 4.2 Criar usuário TI Global

```sql
INSERT INTO usuarios (
  id, email, username, nome, "senhaHash", role, "tenantId",
  ativo, "mustChangePassword", sistemas, "criadoEm", "atualizadoEm"
)
VALUES (
  gen_random_uuid(),
  'ti.global@noreply.local',
  'ti.global',
  '<Nome do Técnico TI Global>',
  '<bcrypt_hash>',
  'ti_global',
  NULL,
  true,
  true,
  ARRAY['feedbackforms'],
  NOW(),
  NOW()
);
```

### 4.3 Criar usuário TI de Unidade

```sql
-- Primeiro descobrir o UUID da unidade:
SELECT id, slug, nome FROM tenants WHERE slug = '<slug_da_unidade>';

INSERT INTO usuarios (
  id, email, username, nome, "senhaHash", role, "tenantId",
  ativo, "mustChangePassword", sistemas, "criadoEm", "atualizadoEm"
)
VALUES (
  gen_random_uuid(),
  'ti.unidade@noreply.local',
  'ti.unidade',
  '<Nome do Técnico TI da Unidade>',
  '<bcrypt_hash>',
  'ti',
  '<uuid_da_unidade>',
  true,
  true,
  ARRAY['feedbackforms'],
  NOW(),
  NOW()
);
```

### 4.4 Verificar usuários criados

```sql
SELECT id, username, role, "tenantId", sistemas, "mustChangePassword"
FROM usuarios
WHERE role IN ('ti', 'ti_global')
  AND sistemas @> ARRAY['feedbackforms'];
```

---

## 5. Checklist de Validação

### Backend

- [ ] Compilação TypeScript sem erros (`npx tsc --noEmit` na pasta `backend/`)
- [ ] Login com `ti_global` retorna JWT com `role: "ti_admin_global"` e `tenantId: null`
- [ ] Login com `ti` retorna JWT com `role: "ti_admin"` e `tenantId` preenchido
- [ ] `GET /api/admin/usuarios?tenantId=<uuid>` com token `ti_admin_global` retorna 200
- [ ] `GET /api/admin/usuarios` com token `ti_admin` ignora parâmetro e retorna apenas a própria unidade
- [ ] `POST /api/admin/usuarios` com `ti_admin_global` + `role: "super_admin"` → 403
- [ ] `POST /api/admin/usuarios` com `ti_admin` + `role: "super_admin"` → 403
- [ ] `POST /api/admin/usuarios` com `hospital_admin` → 403
- [ ] `POST /api/admin/usuarios` com `ti_admin` + `role: "operator_forms"` → 201 (na própria unidade)
- [ ] `POST /api/admin/usuarios` com `holding_admin` + `role: "super_admin"` → 201
- [ ] `POST /api/admin/usuarios/:id/reset-password` com `hospital_admin` → 403
- [ ] `POST /api/admin/usuarios/:id/reset-password` com `ti_admin` para usuário de outra unidade → 404
- [ ] `PATCH /api/admin/usuarios/:id/ativo` com `hospital_admin` → 403

### Frontend

- [ ] `holding_admin`: seletor de unidades visível, botão "Novo Usuário" visível, botões de ação visíveis, opção "Admin Global" no modal
- [ ] `ti_admin_global`: seletor de unidades visível, botão "Novo Usuário" visível, botões de ação visíveis, opção "Admin Global" **ausente** no modal
- [ ] `ti_admin`: sem seletor, lista da própria unidade, botão "Novo Usuário" visível, botões de ação visíveis
- [ ] `hospital_admin`: sem seletor, lista da própria unidade, **sem** botão "Novo Usuário", **sem** botões de ação
- [ ] Badge "TI Unidade" e "TI Global" aparecem na listagem para usuários com roles `ti` e `ti_global`
- [ ] `operator_forms` não acessa `/admin/usuarios` (redirecionado)

### Banco

- [ ] Usuários TI criados têm `sistemas @> ARRAY['feedbackforms']`
- [ ] `mustChangePassword = true` para forçar troca de senha no primeiro login
- [ ] Usuários TI **não** aparecem em outros sistemas que filtrem por sistemas diferentes

---

## 6. Riscos e Cuidados

### 6.1 Banco compartilhado

O `Autenticacao_DB` é compartilhado entre múltiplos sistemas (`feedbackforms`, `linensistem`). Os valores `ti` e `ti_global` na coluna `role` podem ser interpretados por outros sistemas. O risco é baixo — sistemas que não mapearem essas roles receberão o fallback `viewer` (sem acesso). Confirmar com os outros sistemas antes do deploy.

### 6.2 Constante `SYSTEM_ROLES` usa roles do banco

A constante `SYSTEM_ROLES` no service usa os valores **do banco** (`tenant_admin`, `super_admin`, etc.), não os roles do JWT. Os novos valores a adicionar são `'ti'` e `'ti_global'` — **não** `'ti_admin'` e `'ti_admin_global'`. Confundir isso faz com que usuários TI não apareçam na listagem.

### 6.3 `hospital_admin` perde acesso de escrita

Esta é uma restrição intencional de permissão. Admins de unidade que hoje criam usuários perderão essa capacidade. **Comunicar às unidades antes do deploy.**

### 6.4 Ordem de deploy obrigatória

1. Deploy do backend (Passos 1–4)
2. Inserção dos usuários TI no banco (Seção 4)
3. Deploy do frontend (Passos 5–7)
4. Validação completa (Seção 5)

Fazer frontend antes do backend deixa os novos roles sem rota válida no servidor.

### 6.5 Sessões ativas no momento do deploy

JWTs existentes persistem até expirar (1 dia). Usuários `hospital_admin` logados durante o deploy verão os botões de ação no frontend mas receberão 403 do backend ao clicar. A inconsistência resolve-se no próximo login.

---

## Arquivos Modificados — Resumo

| # | Arquivo | O que muda |
|---|---|---|
| 1 | `backend/src/common/types/roles.ts` | Adicionar `'ti_admin' \| 'ti_admin_global'` ao `UserRole` |
| 2 | `backend/src/modules/auth/auth.service.ts` | Adicionar `ti` e `ti_global` ao `ROLE_MAP` |
| 3 | `backend/src/modules/admin-users/admin-users.controller.ts` | Lógica de escopo para novas roles + bloqueio de escrita para `hospital_admin` |
| 4 | `backend/src/modules/admin-users/admin-users.service.ts` | Atualizar `SYSTEM_ROLES` e `toDbRole` |
| 5 | `backend/src/modules/admin-users/dto/create-admin-user.dto.ts` | Adicionar novas roles ao `@IsIn` |
| 6 | `src/types/` (arquivo do `UserRole` frontend) | Adicionar `'ti_admin' \| 'ti_admin_global'` |
| 7 | `src/pages/admin-usuarios/index.tsx` | `isGlobal`, `canEdit`, botões condicionais, labels/estilos TI |

---

*Documento gerado em 2026-04-22. Revisar antes de implementar em produção.*
