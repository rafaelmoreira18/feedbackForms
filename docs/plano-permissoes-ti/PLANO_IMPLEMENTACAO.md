# Plano de Implementação — Coluna `permissoes` + Roles TI

**Data:** 2026-04-27
**Projeto:** feedbackforms — Sistema de Pesquisa de Satisfação de Pacientes
**Status:** Planejamento

---

## Objetivo

Permitir que apenas alguns `super_admin` possam gerenciar usuários na tela `/admin/usuarios`,
sem alterar o role deles. Paralelamente, adicionar os novos perfis de TI (`ti_admin`, `ti_admin_global`)
com escopo próprio de permissões.

---

## Decisão de Arquitetura

Adotar a **Opção 1 — coluna `permissoes text[]`** no banco `Autenticacao_DB`.

Ver detalhes: [OPCAO_1_PERMISSOES.md](./OPCAO_1_PERMISSOES.md)

---

## Etapas

### Etapa 1 — Migration no banco (`Autenticacao_DB`)

- Adicionar coluna `permissoes text[] NOT NULL DEFAULT '{}'` na tabela `usuarios`
- Conceder `permissoes = ARRAY['gerenciar_usuarios']` aos `super_admin` que precisam de acesso

**Arquivo:** `backend/src/database/migrations/add-permissoes-usuarios.sql`

---

### Etapa 2 — Backend: JWT

**Arquivo:** `backend/src/modules/auth/auth.service.ts`

- Incluir o campo `permissoes` no payload do JWT ao fazer login
- Adicionar mapeamento de roles: `ti → ti_admin`, `ti_global → ti_admin_global`

---

### Etapa 3 — Backend: Guard / Tipos

**Arquivo:** `backend/src/common/types/roles.ts` (ou equivalente)

- Adicionar `ti_admin` e `ti_admin_global` ao tipo `UserRole`
- Atualizar interface `ReqUser` para incluir `permissoes: string[]`

---

### Etapa 4 — Backend: Controller `admin-users`

**Arquivo:** `backend/src/modules/admin-users/admin-users.controller.ts`

- Abrir rota para `ti_admin` e `ti_admin_global` no decorator `@Roles()`
- `super_admin` (holding_admin) só passa se tiver `permissoes.includes('gerenciar_usuarios')`
- `hospital_admin` passa para leitura, bloqueado em escrita
- `ti_admin`: escopo fixo na própria unidade, não cria `super_admin`
- `ti_admin_global`: escopo global, não cria `super_admin`

---

### Etapa 5 — Backend: Service `admin-users`

**Arquivo:** `backend/src/modules/admin-users/admin-users.service.ts`

- Atualizar `SYSTEM_ROLES` para incluir `'ti'` e `'ti_global'` (valores do banco)
- Atualizar `toDbRole` para mapear `ti_admin → ti` e `ti_admin_global → ti_global`
- Atualizar DTO: adicionar `ti_admin` e `ti_admin_global` ao `@IsIn`

---

### Etapa 6 — Frontend: Tipos e contexto

- Adicionar `ti_admin` e `ti_admin_global` ao tipo `UserRole`
- Incluir `permissoes: string[]` no tipo do usuário autenticado (`auth-context`)

---

### Etapa 7 — Frontend: Rota e página

**Arquivo:** `src/App.tsx`

- `AdminRoute` já deixa `ti_admin`/`ti_admin_global` passarem (não estão na lista de bloqueio)
- `holding_admin` sem `permissoes.includes('gerenciar_usuarios')` deve ser redirecionado para `/dashboard`

**Arquivo:** `src/pages/admin-usuarios/index.tsx`

- `isGlobal`: `holding_admin` (com permissão) ou `ti_admin_global`
- `canEdit`: qualquer role exceto `hospital_admin`
- Botão "+ Novo Usuário" e ações condicionados a `canEdit`
- Badges e estilos para roles `ti` e `ti_global`

---

## Ordem de Deploy

1. Migration no banco (`Autenticacao_DB`)
2. Deploy do backend
3. Deploy do frontend
4. Validação (checklist abaixo)

---

## Checklist de Validação

### Banco
- [ ] Coluna `permissoes` existe na tabela `usuarios`
- [ ] `super_admin` com acesso tem `permissoes @> ARRAY['gerenciar_usuarios']`
- [ ] `super_admin` sem acesso tem `permissoes = '{}'`

### Backend
- [ ] Login com `super_admin` + permissão → JWT contém `permissoes: ['gerenciar_usuarios']`
- [ ] Login com `super_admin` sem permissão → JWT contém `permissoes: []`
- [ ] `GET /api/admin/usuarios` com `holding_admin` sem permissão → 403
- [ ] `GET /api/admin/usuarios` com `holding_admin` com permissão → 200
- [ ] `GET /api/admin/usuarios` com `ti_admin_global` → 200
- [ ] `POST /api/admin/usuarios` com `hospital_admin` → 403
- [ ] `POST /api/admin/usuarios` com `ti_admin` + `role: super_admin` → 403
- [ ] `POST /api/admin/usuarios` com `holding_admin` (com permissão) + `role: super_admin` → 201

### Frontend
- [ ] `holding_admin` sem permissão não vê `/admin/usuarios` (redirecionado)
- [ ] `holding_admin` com permissão vê tela completa com opção "Admin Global" no modal
- [ ] `ti_admin_global` vê tela completa sem opção "Admin Global"
- [ ] `ti_admin` vê escopo da própria unidade, sem opção "Admin Global"
- [ ] `hospital_admin` vê lista somente leitura, sem botões de ação

---

## Arquivos Modificados — Resumo

| # | Arquivo | O que muda |
|---|---|---|
| 1 | `backend/src/database/migrations/add-permissoes-usuarios.sql` | Nova migration (novo arquivo) |
| 2 | `backend/src/modules/auth/auth.service.ts` | JWT inclui `permissoes`; mapeamento de roles TI |
| 3 | `backend/src/common/types/roles.ts` | Adicionar `ti_admin`, `ti_admin_global` |
| 4 | `backend/src/modules/admin-users/admin-users.controller.ts` | Lógica de permissão por role + campo `permissoes` |
| 5 | `backend/src/modules/admin-users/admin-users.service.ts` | `SYSTEM_ROLES`, `toDbRole` |
| 6 | `backend/src/modules/admin-users/dto/create-admin-user.dto.ts` | `@IsIn` com roles TI |
| 7 | `src/types/` | `UserRole` + campo `permissoes` no usuário |
| 8 | `src/App.tsx` | `AdminRoute` verifica permissão para `holding_admin` |
| 9 | `src/pages/admin-usuarios/index.tsx` | `isGlobal`, `canEdit`, badges, modal |
