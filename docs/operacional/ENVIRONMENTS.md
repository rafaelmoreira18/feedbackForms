# Ambientes — Dev e Prod

---

## Situação atual (Phase 3 em andamento)

### Prod — `Multi_UnidadesDB`

Produção ainda roda num banco único com **tudo junto**: auth, feedbackforms e
linensistem na mesma base. As tabelas do feedbackforms têm nomenclatura antiga
(legado Prisma):

- `respostas_formulario` — 222 respostas reais de pacientes
- `templates_formulario` — templates de formulário

Nenhuma mudança foi feita aqui. Prod está estável.

### Dev — `Pesquisa_Satisfacao_Paciente_DB` + `Autenticacao_DB`

Dev já aponta para os **bancos novos separados** no mesmo RDS. Esses bancos foram
criados na Phase 3 com schema novo (nomenclatura TypeORM/NestJS) e contêm apenas
**dados de teste** (1 registro cada). Estão sendo validados agora — quando aprovados,
viram prod.

### O cutover (Phase 3.4)

Quando dev estiver validado, o cutover de prod consiste em:

1. **Migrar os dados** do `Multi_UnidadesDB` para os bancos novos via `scripts/phase3-migrate.sh`
   - `respostas_formulario` → `form3_responses` (com transformação de schema)
   - `templates_formulario` → `form_templates` + `form_template_blocks` + `form_questions`
   - `tenants` → `Autenticacao_DB.tenants`
   - `usuarios` → `Autenticacao_DB.usuarios`
2. **Trocar 4 variáveis** no `.env` do servidor:
   - `NODE_ENV` → `production`
   - `CORS_ORIGINS` → `https://mediallquality.com`
   - `DB_SSL_REJECT_UNAUTHORIZED` → `true`
   - `JWT_SECRET` → segredo forte de prod
3. **Redeploy** — `npm run build && pm2 restart feedbackforms-api`
4. `Multi_UnidadesDB` permanece intacto por 30 dias como rollback, depois é dropado.

Existem **3 bancos no mesmo servidor RDS** (`dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com`):

| Banco | Estado | Conteúdo |
|---|---|---|
| `Multi_UnidadesDB` | **PRODUÇÃO atual** | tudo junto: auth + feedbackforms (legado) + linensistem |
| `Pesquisa_Satisfacao_Paciente_DB` | **DEV** (em validação) | schema novo feedbackforms — só dados de teste |
| `Autenticacao_DB` | **DEV** (em validação) | tenants + usuários separados — só dados de teste |

---

## O que está em cada banco

### Multi_UnidadesDB — PRODUÇÃO

Todas as tabelas juntas num banco só:

```
AUTH / compartilhado:
  tenants                   (6 registros)
  usuarios                  (36 registros)

FEEDBACKFORMS (tabelas legadas — nomenclatura antiga):
  respostas_formulario      (222 registros — dados reais de prod)
  templates_formulario

LINENSISTEM:
  rodadas, rondas_ocorrencias, agendamentos_manutencao,
  ambientes_inspecionados, ambientes_tenant, blocos_tenant,
  pessoas, movimentacoes, ocorrencias_detalhe, abastecimentos,
  alteracoes, links_publicos_bens, registros_ambientes,
  rondas_draft
```

### Pesquisa_Satisfacao_Paciente_DB — DEV (banco novo Phase 3)

Tabelas feedbackforms com schema novo (nomenclatura TypeORM/NestJS):

```
form3_responses       (1 registro — só testes)
form_templates        (1 registro)
form_template_blocks
form_questions
training_sessions     (1 registro)
training_responses    (1 registro)
tenants               (1 registro — cópia de teste)
users                 (1 registro)
```

> Nota: `tenants` e `users` aqui são cópias de teste. A fonte de verdade para
> tenants/usuários em prod é `Multi_UnidadesDB`. Em dev, o sistema autentica
> via `Autenticacao_DB` (abaixo).

### Autenticacao_DB — DEV (banco novo Phase 3)

```
tenants     (11 registros — cópia de Multi_UnidadesDB)
usuarios    (4 registros — cópia de Multi_UnidadesDB)
```

---

## Configuração dos ambientes

### Dev — `backend/.env` (padrão, carregado por `npm run start:dev`)

Aponta para os bancos novos no RDS — testando a Phase 3:

```
DB_DATABASE      = Pesquisa_Satisfacao_Paciente_DB
AUTH_DB_DATABASE = Autenticacao_DB
DB_SYNCHRONIZE   = false
NODE_ENV         = development
CORS_ORIGINS     = localhost:5173, localhost:5174, localhost:3000
SSL_REJECT_UNAUTHORIZED = false
```

### Prod (quando o cutover acontecer) — mesmo `.env`, ajustes:

```
DB_DATABASE      = Pesquisa_Satisfacao_Paciente_DB  (igual)
AUTH_DB_DATABASE = Autenticacao_DB                  (igual)
DB_SYNCHRONIZE   = false                            (igual)
NODE_ENV         = production
CORS_ORIGINS     = https://mediallquality.com
SSL_REJECT_UNAUTHORIZED = true
JWT_SECRET       = <segredo forte>
```

O cutover é basicamente: migrar os dados reais do `Multi_UnidadesDB` para os bancos
novos + trocar essas 4 variáveis no servidor + redeploy.

---

## Migrations pendentes antes do cutover

`DB_SYNCHRONIZE=false` — toda mudança de schema precisa ser aplicada manualmente.

### Necessário agora (erro 500 em dev):

`backend/src/database/migrations/add-cpf-justificativa.sql`

```sql
ALTER TABLE form3_responses
  ALTER COLUMN "patientCpf" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "cpfJustificativa" VARCHAR(60) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "cpfAddedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL;
```

Aplicar em: **`Pesquisa_Satisfacao_Paciente_DB`** (banco de dev)

### Para o cutover de prod:

Quando `Multi_UnidadesDB` for migrado para os bancos novos, as tabelas
`form3_responses` e `form_templates` (legado) precisam ser copiadas/transformadas
para o schema novo (`form3_responses`, `form_templates`, `form_template_blocks`,
`form_questions`). Os scripts estão em `scripts/phase3-migrate.sh`.

---

## Alternativa offline — `backend/.env.local`

Para trabalhar sem acesso ao RDS (Docker local):

```
DB_HOST          = localhost:5432   banco: feedbackforms
AUTH_DB_HOST     = localhost:5433   banco: Multi_UnidadesDB
DB_SYNCHRONIZE   = true             TypeORM cria colunas automaticamente
JWT_SECRET       = local-dev-secret (incompatível com tokens do RDS)
```

Subir: `docker compose up -d`

Não é o fluxo padrão de desenvolvimento — apenas para trabalho offline.

---

## Resumo do fluxo Phase 3

```
AGORA:
  Prod  →  Multi_UnidadesDB (tudo junto)
  Dev   →  Pesquisa_Satisfacao_Paciente_DB + Autenticacao_DB (separados, em teste)

APÓS CUTOVER (Phase 3.4):
  Prod  →  Pesquisa_Satisfacao_Paciente_DB + Autenticacao_DB
  Multi_UnidadesDB  →  mantido por 30 dias, depois dropado
```

Ver `desktop/architecture-plan.txt` para checklist completo do cutover.
