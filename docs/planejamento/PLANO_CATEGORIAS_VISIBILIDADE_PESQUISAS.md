# Plano: Categorias e Visibilidade em Pesquisas Corporativas

## Contexto

Pesquisas corporativas são criadas **diretamente no banco** pelo admin global.
O sistema só precisa **ler, filtrar e exibir** corretamente.

Não há UI de criação a alterar — apenas:
1. Migration no banco
2. Ajuste no backend (entity + service)
3. Ajuste no frontend (agrupamento por categoria + filtro de visibilidade)

---

## O que será implementado

### Feature 1 — Categorias (pastas)
Cada pesquisa pertence a uma categoria livre (`varchar`).
O admin insere no banco: `"Treinamento"`, `"Clima Organizacional"`, `"Pesquisa de Saída"`, etc.
O frontend agrupa os cards por categoria na listagem.

### Feature 2 — Visibilidade
Controla quem pode ver cada pesquisa:

| Valor | Quem vê |
|---|---|
| `'global'` | Todos os tenants (comportamento atual) |
| `'especifica'` | Apenas os tenants listados em `allowedTenantIds` |
| `'privada'` | Apenas o `holding_admin` global |

---

## Estado atual do banco

```sql
-- pesquisas_corporativas hoje
id            UUID PK
tenantId      UUID NULL  -- NULL = pesquisa global
titulo        VARCHAR
slug          VARCHAR
tipo          VARCHAR
blocos        JSONB
ativa         BOOLEAN DEFAULT true
periodo       VARCHAR NULL
criadoEm     TIMESTAMP
atualizadoEm TIMESTAMP
```

---

## Etapa 1 — Migration no banco (PostgreSQL)

```sql
-- migration: add_categoria_visibilidade_to_pesquisas_corporativas

ALTER TABLE pesquisas_corporativas
  ADD COLUMN IF NOT EXISTS categoria         VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS visibility        VARCHAR(20)  NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS "allowedTenantIds" UUID[]       NULL;

-- Index para acelerar o filtro de visibilidade no findAll
CREATE INDEX IF NOT EXISTS idx_pesquisas_visibility
  ON pesquisas_corporativas (visibility);

-- Garantia: linhas existentes já ficam com visibility = 'global' pelo DEFAULT
```

**Rollback:**
```sql
ALTER TABLE pesquisas_corporativas
  DROP COLUMN IF EXISTS categoria,
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS "allowedTenantIds";

DROP INDEX IF EXISTS idx_pesquisas_visibility;
```

**Impacto em produção:** zero — todas as colunas são nullable ou têm default.

---

## Etapa 2 — Backend

### 2.1 Entity (`pesquisa-corporativa.entity.ts`)

Adicionar os 3 campos:

```ts
/** Categoria livre: "Treinamento", "Clima Organizacional", etc. Inserida via banco. */
@Column({ type: 'varchar', length: 100, nullable: true, default: null })
categoria: string | null;

/** Controla quem pode ver esta pesquisa */
@Column({ type: 'varchar', length: 20, default: 'global' })
visibility: 'global' | 'especifica' | 'privada';

/** Preenchido quando visibility = 'especifica'. Lista de tenantIds autorizados. */
@Column({ type: 'uuid', array: true, nullable: true, default: null })
allowedTenantIds: string[] | null;
```

Adicionar o tipo `PesquisaVisibility` para evitar strings soltas:

```ts
export type PesquisaVisibility = 'global' | 'especifica' | 'privada';
```

### 2.2 Service — refatorar `findAll()` (`pesquisas-corporativas.service.ts`)

O método hoje retorna tudo onde `tenantId = X OR tenantId IS NULL`.
Com visibilidade, a lógica fica:

```
Retornar pesquisa se:
  (a) tenantId da pesquisa = tenantId do usuário               → pesquisa da própria unidade
  (b) visibility = 'global'                                    → visível para todos
  (c) visibility = 'especifica' AND tenantId IN allowedTenantIds → liberada para este tenant
  (d) visibility = 'privada' AND usuário é holding_admin global → só o admin global vê
```

O `findAll()` atual não recebe o usuário — precisará receber `requestingTenantId` e `isGlobalAdmin`:

```ts
async findAll(
  tenantSlug: string,
  options: { isGlobalAdmin: boolean },
): Promise<PesquisaCorporativaEntity[]>
```

**Implementação com QueryBuilder** (necessário para a condição de array):

```ts
async findAll(tenantSlug: string, options: { isGlobalAdmin: boolean }) {
  const tenantId = await this.tenantService.resolveId(tenantSlug);

  const qb = this.repo.createQueryBuilder('p');

  // (a) pesquisa da própria unidade — sempre visível
  qb.where('p."tenantId" = :tenantId', { tenantId });

  // (b) global — visível para todos
  qb.orWhere('p.visibility = :global', { global: 'global' });

  // (c) específica — tenant está na lista de permitidos
  qb.orWhere(
    'p.visibility = :especifica AND :tenantId = ANY(p."allowedTenantIds")',
    { especifica: 'especifica', tenantId },
  );

  // (d) privada — só holding_admin global (sem tenantId próprio) vê
  if (options.isGlobalAdmin) {
    qb.orWhere('p.visibility = :privada', { privada: 'privada' });
  }

  return qb.orderBy('p."criadoEm"', 'DESC').getMany();
}
```

### 2.3 Controller — passar `isGlobalAdmin` para o service

O controller já tem acesso ao `req.user`. Adicionar:

```ts
@Get()
@UseGuards(JwtAuthGuard, SistemaGuard, RolesGuard)
@Roles('rh_admin', 'hospital_admin', 'holding_admin')
findAll(@Param('tenantSlug') tenantSlug: string, @Req() req: Request) {
  const user = req.user as { role?: string };
  const isGlobalAdmin = user?.role === 'holding_admin';
  return this.service.findAll(tenantSlug, { isGlobalAdmin });
}
```

### 2.4 `findBySlug()` — aplicar mesma lógica de visibilidade

O método público (formulário sem auth) não precisa de filtro — qualquer um com o link acessa.
O método autenticado (admin visualizando) precisa do mesmo filtro do `findAll()`.
Extrair helper privado `buildVisibilityConditions()` e reutilizar nos dois métodos.

---

## Etapa 3 — Frontend

### 3.1 Atualizar o tipo `PesquisaCorporativa` (`src/types/index.ts`)

```ts
export type PesquisaVisibility = 'global' | 'especifica' | 'privada';

export interface PesquisaCorporativa {
  // campos atuais...
  categoria: string | null;          // novo
  visibility: PesquisaVisibility;    // novo
  allowedTenantIds: string[] | null; // novo
}
```

### 3.2 Agrupamento por categoria (`pesquisas-corporativas/index.tsx`)

Substituir a lista plana por grupos:

```ts
// helper puro — fácil de testar
function groupByCategoria(pesquisas: PesquisaCorporativa[]) {
  const map = new Map<string, PesquisaCorporativa[]>();
  for (const p of pesquisas) {
    const key = p.categoria ?? 'Geral';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  // ordenar: categorias com nome antes de "Geral"
  return Array.from(map.entries()).sort(([a], [b]) =>
    a === 'Geral' ? 1 : b === 'Geral' ? -1 : a.localeCompare(b, 'pt-BR'),
  );
}
```

**Renderização:**
```tsx
{groupByCategoria(pesquisas).map(([categoria, items]) => (
  <section key={categoria}>
    <Text variant="body-sm-bold" className="text-gray-300 uppercase tracking-wide mb-2">
      {categoria}
    </Text>
    {items.map(p => <PesquisaCard key={p.id} pesquisa={p} ... />)}
  </section>
))}
```

### 3.3 Badge de visibilidade no `PesquisaCard` (`pesquisa-table.tsx`)

Adicionar badge discreto para o `holding_admin` saber o nível de visibilidade:

```tsx
{pesquisa.visibility !== 'global' && (
  <span className={`text-xs px-2 py-0.5 rounded-full border ${
    pesquisa.visibility === 'privada'
      ? 'bg-gray-100 text-gray-400 border-gray-200'
      : 'bg-blue-50 text-blue-600 border-blue-200'
  }`}>
    {pesquisa.visibility === 'privada' ? 'Privada' : 'Específica'}
  </span>
)}
```

---

## Etapa 4 — Testes manuais antes de subir para produção

| Cenário | Resultado esperado |
|---|---|
| Pesquisa `visibility='global'` | Aparece para todos os tenants |
| Pesquisa `visibility='privada'` | Aparece só para `holding_admin` |
| Pesquisa `visibility='especifica'` com tenant A na lista | Aparece para tenant A, não aparece para tenant B |
| Pesquisas sem `categoria` | Aparecem no grupo "Geral" |
| Pesquisas com `categoria='Treinamento'` | Aparecem no grupo "Treinamento" |
| Rollback da migration | Banco volta ao estado original sem perda |

---

## Critério de sucesso

- Migration roda sem erro em produção
- `npm run build` no backend e frontend sem erros
- Comportamento atual (pesquisas `global`) continua idêntico
- Agrupamento por categoria exibido corretamente na listagem
- `holding_admin` vê pesquisas privadas; outros roles não veem

---

## Sequência de execução

```
Etapa 1  →  Migration no banco (produção: rodar manualmente)
Etapa 2  →  Backend: entity → service → controller
Etapa 3  →  Frontend: types → agrupamento → badge
Etapa 4  →  Teste manual nos 5 cenários acima
```

Cada etapa termina com `npm run build` antes de avançar.
