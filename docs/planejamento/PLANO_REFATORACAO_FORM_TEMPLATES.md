# Plano de Refatoração — Form Templates Globais com Override por Tenant

**Data:** 2026-04-28  
**Status:** Discussão / Aguardando aprovação  
**Prioridade:** Baixa (não afeta funcionamento atual)

---

## Problema Identificado

### Situação atual

A estrutura de formulários está organizada assim:

```
form_templates      → 1 registro por (tenant + tipo de formulário)
form_template_blocks → blocos dentro de cada template
form_questions      → perguntas dentro de cada bloco
```

**Contagens reais no banco (28/04/2026):**
- `form_templates`: 39 registros (8 hospitais × ~5 tipos cada)
- `form_template_blocks`: 119 registros
- `form_questions`: ~450 registros

**O problema:** O formulário "Internação Hospitalar" do Hospital A tem exatamente as mesmas
perguntas que o Hospital B, C, D... As perguntas estão copiadas N vezes no banco.

Exemplo — pergunta duplicada em 8 hospitais:
```
"Como você avalia o conforto do quarto de internação durante sua permanência?"
```
Essa frase existe 8 vezes na tabela `form_questions`. Deveria existir 1 vez.

### Consequências hoje
- Mudar uma pergunta para todos os hospitais = atualizar N linhas no banco
- Adicionar um novo hospital = rodar seed completo com todas as perguntas
- Dado redundante dificulta análise e manutenção futura

---

## Solução Proposta

### Conceito: Templates globais + override por tenant

Em vez de cada tenant ter sua cópia das perguntas, os templates passam a ser **globais**
(sem `tenantId`). Cada tenant apenas informa quais perguntas quer **ocultar** ou
**adicionar** em relação ao padrão.

### Nova estrutura de tabelas

```
form_templates (global — sem tenantId)
  id, slug, name, active

form_template_blocks (global — sem tenantId)
  id, templateId, title, order

form_questions (global — sem tenantId)
  id, blockId, questionKey, text, scale, subReasons, order

tenant_form_config (novo — associa tenant a template)
  id, tenantId, templateSlug, active
  → controla quais tipos de formulário cada tenant usa

tenant_question_overrides (novo — exceções por tenant)
  id, tenantId, questionKey, action (hide | show)
  → para quando um tenant precisa de uma pergunta a menos/a mais
```

### Como ficaria o fluxo

**Caso padrão (99% dos casos) — tenant sem override:**
```
GET /api/{slug}/forms/internacao
→ busca form_templates WHERE slug = 'internacao'
→ busca blocos e perguntas globais
→ retorna o formulário completo
```

**Caso com override — tenant quer ocultar uma pergunta:**
```
GET /api/hrgm/forms/internacao
→ busca form_templates WHERE slug = 'internacao'
→ busca blocos e perguntas globais
→ busca tenant_question_overrides WHERE tenantId = 'hrgm'
→ filtra/merge: remove as perguntas com action = 'hide'
→ retorna o formulário customizado para o HRGM
```

---

## Resultado após refatoração

| Métrica | Antes | Depois |
|---|---|---|
| Linhas em form_templates | 39 | ~10 (tipos únicos) |
| Linhas em form_template_blocks | 119 | ~30 |
| Linhas em form_questions | ~450 | ~90 |
| Mudar pergunta para todos | N updates | 1 update |
| Adicionar novo hospital | Seed completo | 1 linha em tenant_form_config |
| Pergunta diferente por tenant | já suportado | 1 linha em tenant_question_overrides |

---

## Isso quebra produção?

**Não quebra**, pois `form3_responses` não tem nenhuma FK para templates, blocos ou
perguntas. Ela guarda apenas strings:

```json
{ "formType": "internacao", "answers": [{ "questionId": "q1", "value": 3 }] }
```

Reorganizar os templates não afeta nenhuma resposta histórica de paciente.

**O único risco** é fazer o deploy do novo código antes de migrar o banco — o que é
evitado pela ordem de execução abaixo.

---

## Ordem de Execução — Zero Downtime

A regra é: **banco primeiro, código depois. Nunca o inverso.**

```
PASSO 1 — Criar novas tabelas (sem remover nada do banco)
  → Banco tem estrutura antiga + nova ao mesmo tempo
  → Produção continua funcionando normalmente com código antigo
  → Risco: nenhum

PASSO 2 — Popular as novas tabelas com script de migração
  → Deduplica templates/blocos/perguntas
  → Popular tenant_form_config com tenants atuais
  → Código antigo ainda em produção, sem impacto
  → Risco: nenhum (dados antigos intactos)

PASSO 3 — Deploy do novo código
  → Backend passa a ler das novas tabelas globais
  → Se algo falhar: rollback do deploy em segundos
  → Banco ainda tem dados antigos intactos para qualquer rollback
  → Risco: baixo, reversível

PASSO 4 — Limpeza (só após confirmar que tudo funciona bem)
  → Remover coluna tenantId de form_templates
  → Deletar blocos e perguntas duplicados
  → Remover seeds antigos
  → Risco: nenhum (essa etapa é irreversível, mas só executa após validação)
```

Em nenhum momento o sistema fica sem dados válidos.
Rollback nos passos 1, 2 e 3 é seguro e imediato.

---

## Etapas de Implementação

### Etapa 1 — Migração do banco
- Criar tabela `tenant_form_config`
- Criar tabela `tenant_question_overrides`
- Script SQL para deduplicar `form_template_blocks` (manter 1 por slug)
- Script SQL para deduplicar `form_questions` (manter 1 por questionKey)
- Popular `tenant_form_config` com os tenants e slugs atuais
- **Não remover** `tenantId` de `form_templates` ainda

### Etapa 2 — Backend
- Ajustar TypeORM entities (tornar tenantId opcional em FormTemplateEntity)
- Criar entities para `TenantFormConfig` e `TenantQuestionOverride`
- Ajustar `FormTemplatesService.getForTenant()` para fazer o merge com overrides
- Ajustar endpoint `GET /api/:tenantSlug/form-templates`
- Nenhuma mudança em `form3_responses` — respostas não são afetadas

### Etapa 3 — Verificação em produção
- Testar formulários de todos os tenants ativos
- Confirmar que respostas antigas continuam visíveis nos dashboards
- Testar cenário de override se algum tenant precisar

### Etapa 4 — Limpeza final
- Remover coluna `tenantId` de `form_templates`
- Deletar blocos e perguntas duplicados do banco
- Remover seeds antigos que criavam templates por tenant
- Criar seed global único por tipo de formulário

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Formulários quebrarem em produção | Baixa | Manter backup antes da migração; testar em dev primeiro |
| Respostas antigas ficarem órfãs | Nenhuma | `form3_responses` usa `formType` (string) e `answers` (jsonb) — não tem FK para templates |
| Override complexo demais | Baixa | Começar apenas com `hide`; adicionar `show` só se necessário |

---

## Decisão Necessária

Antes de implementar, confirmar:

1. **Vale fazer agora?**  
   O sistema funciona hoje. A refatoração é melhoria de arquitetura, não urgência.
   Recomendado fazer **antes de adicionar novos hospitais** para evitar crescer o problema.

2. **Override por questionKey ou por bloco inteiro?**  
   Proposta atual: override por `questionKey` individual (mais granular).
   Alternativa: override por bloco inteiro (mais simples, menos flexível).

3. **Tenants podem criar perguntas próprias (action: show)?**  
   Ou apenas ocultar perguntas do padrão global?

---

## Observações

- `form3_responses` não é afetada em nada — as respostas guardam `questionId` como string no JSONB
- A lógica de analytics também não muda pois usa `questionKey` para agrupar
- Migração pode ser feita com zero downtime (criar novas tabelas, migrar dados, depois trocar o código)
