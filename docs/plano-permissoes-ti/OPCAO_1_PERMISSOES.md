# Opção 1 — Coluna `permissoes text[]`

## O que é

Uma única coluna no banco `Autenticacao_DB` que guarda um array de strings representando
permissões específicas de um usuário, independente do seu role.

```sql
ALTER TABLE usuarios
  ADD COLUMN permissoes text[] NOT NULL DEFAULT '{}';
```

---

## Por que essa abordagem

| Critério | Resultado |
|---|---|
| Migration necessária | Sim — 1 linha de SQL |
| Impacto em usuários existentes | Zero — defaulta `'{}'` |
| Escala para novas permissões | Sim — só adiciona string ao array |
| Legível no banco | Sim — `SELECT permissoes FROM usuarios` |
| Sem schema change futuro | Sim — novas permissões são novos valores no array |

---

## Permissões previstas

| Valor no array | O que libera |
|---|---|
| `gerenciar_usuarios` | Acesso de escrita à tela `/admin/usuarios` |

Futuras permissões seguem o mesmo padrão — ex: `exportar_relatorio`, `ver_cpf_completo`.

---

## Como funciona na prática

### Banco

```sql
-- super_admin com acesso à gestão de usuários
UPDATE usuarios
SET permissoes = ARRAY['gerenciar_usuarios']
WHERE id = '<uuid-do-admin-autorizado>';

-- super_admin sem acesso (padrão — não precisa fazer nada, já é '{}')
```

### JWT (auth.service.ts)

O campo `permissoes` é incluído no payload do token ao fazer login:

```ts
const payload = {
  sub:        user.id,
  role:       mappedRole,
  tenantId:   user.tenantId,
  permissoes: user.permissoes, // string[]
};
```

### Backend — verificação no controller

```ts
function podeGerenciarUsuarios(role: string, permissoes: string[]): boolean {
  if (role === 'ti_admin_global') return true;
  if (role === 'ti_admin')        return true;
  if (role === 'holding_admin')   return permissoes.includes('gerenciar_usuarios');
  return false;
}
```

### Frontend — contexto de autenticação

```ts
// src/contexts/auth-context.tsx (ou src/types/)
interface AuthUser {
  id:          string;
  role:        UserRole;
  tenantId:    string | null;
  permissoes:  string[];  // NOVO
  // ...
}
```

```ts
// src/pages/admin-usuarios/index.tsx
const canEdit =
  user?.role === 'ti_admin' ||
  user?.role === 'ti_admin_global' ||
  (user?.role === 'holding_admin' && user.permissoes.includes('gerenciar_usuarios'));
```

---

## O que NÃO muda

- Roles existentes (`super_admin`, `tenant_admin`, `operator_forms`) continuam funcionando igual
- Usuários sem a coluna preenchida continuam com `permissoes = '{}'` (array vazio)
- Nenhum outro sistema que usa o `Autenticacao_DB` é afetado — a coluna é aditiva

---

## Migration completa

```sql
-- Arquivo: backend/src/database/migrations/add-permissoes-usuarios.sql
-- Executar em: Autenticacao_DB

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS permissoes text[] NOT NULL DEFAULT '{}';

-- Conceder acesso ao(s) super_admin desejado(s):
-- UPDATE usuarios SET permissoes = ARRAY['gerenciar_usuarios'] WHERE id = '<uuid>';

-- Verificar:
-- SELECT id, username, role, permissoes FROM usuarios WHERE role = 'super_admin';
```
