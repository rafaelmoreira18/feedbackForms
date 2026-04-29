# Plano — Pesquisas Corporativas (Módulo Genérico)

**Data:** 2026-04-28
**Status:** Discussão / Aguardando aprovação
**Prioridade:** Média

---

## Problema / Motivação

O sistema já possui pesquisas de treinamento (reação e eficácia) voltadas a colaboradores.
Existe demanda por um módulo de pesquisas corporativas internas — clima organizacional,
engajamento, desligamento, etc. — com estrutura flexível onde cada pesquisa pode ter
blocos, perguntas e tipos de resposta diferentes.

---

## Arquitetura Proposta

### Princípios

- **Genérica por design:** o módulo não conhece "clima" ou "engajamento" — só pesquisa, bloco, pergunta e resposta
- **Configurável por banco:** blocos e perguntas ficam no banco, não hardcoded — cada pesquisa define os seus
- **Escalas variáveis por pergunta:** uma pergunta pode ser likert5, outra texto livre, outra múltipla escolha
- **Respostas unificadas:** uma única tabela de respostas com JSONB flexível por pesquisa
- **Zero downtime:** banco primeiro, código depois

---

## Estrutura de Tabelas

```
pesquisas_corporativas
  id            UUID PK
  tenantId      VARCHAR         tenant que criou (ou null = global/Mediall)
  titulo        VARCHAR         "Pesquisa de Clima 2026 — 1º Semestre"
  slug          VARCHAR         "clima-2026-s1" (único por tenant)
  tipo          VARCHAR         "clima" | "engajamento" | "saida" | ...
  ativa         BOOLEAN         controla se o link público aceita respostas
  periodo       VARCHAR         "2026-S1", "2026-Q2", etc. (livre)
  criadoEm     TIMESTAMP
  atualizadoEm TIMESTAMP

pesquisas_blocos
  id            UUID PK
  pesquisaId    UUID FK → pesquisas_corporativas (cascade delete)
  titulo        VARCHAR         "Bloco 1 – Comunicação"
  descricao     VARCHAR NULL    subtítulo opcional do bloco
  ordem         INT

pesquisas_perguntas
  id            UUID PK
  blocoId       UUID FK → pesquisas_blocos (cascade delete)
  texto         TEXT            enunciado da pergunta
  escala        VARCHAR(16)     ver tipos abaixo
  opcoes        JSONB NULL      apenas para escala = 'opcoes' ou 'multipla'
  obrigatoria   BOOLEAN         default true
  ordem         INT

pesquisas_respostas
  id                UUID PK
  tenantId          VARCHAR
  pesquisaId        UUID FK → pesquisas_corporativas (cascade delete)
  nomeRespondente   VARCHAR     default "Anônimo"
  metadados         JSONB       campos variáveis por tipo de pesquisa
                                ex: { "tempoDeEmpresa": "1-3 anos", "unidade": "HRGM" }
  answers           JSONB       array de respostas por pergunta (ver estrutura abaixo)
  criadoEm         TIMESTAMP
  deletedAt         TIMESTAMP NULL  soft delete
```

---

## Tipos de Escala por Pergunta

| escala | Descrição | Valor armazenado |
|---|---|---|
| `likert5` | 1 a 5 (Discordo totalmente → Concordo totalmente) | número 1-5 |
| `likert3` | 1 a 3 (Ruim / Bom / Ótimo) | número 1-3 |
| `nps` | 0 a 10 | número 0-10 |
| `aberta` | Texto livre | string |
| `opcoes` | Múltipla escolha (uma opção) | string (valor da opção) |
| `multipla` | Múltipla escolha (várias opções) | array de strings |
| `booleano` | Sim / Não | boolean |

---

## Estrutura do JSONB `answers`

```json
[
  { "perguntaId": "uuid-q1", "valor": 4 },
  { "perguntaId": "uuid-q2", "valor": "Até 6 meses" },
  { "perguntaId": "uuid-q3", "valor": "O ambiente é muito positivo e colaborativo." },
  { "perguntaId": "uuid-q4", "valor": true },
  { "perguntaId": "uuid-q5", "valor": ["Comunicação", "Liderança"] }
]
```

O campo `valor` é tipado como `any` no JSONB — o tipo real é determinado pela
`escala` da pergunta correspondente.

---

## Estrutura de Pastas (Backend)

```
src/modules/pesquisas-corporativas/
  pesquisas-corporativas.module.ts
  pesquisas-corporativas.controller.ts    ← gestão (autenticado)
  pesquisas-corporativas.service.ts
  pesquisas-respostas.controller.ts       ← submissão pública + leitura autenticada
  pesquisas-respostas.service.ts
  entities/
    pesquisa-corporativa.entity.ts
    pesquisa-bloco.entity.ts
    pesquisa-pergunta.entity.ts
    pesquisa-resposta.entity.ts
  dto/
    create-pesquisa.dto.ts
    create-resposta.dto.ts
  seeds/
    clima-2026-s1.seed.ts               ← seed da primeira pesquisa de clima
```

---

## Endpoints

### Gestão (autenticado — rh_admin / holding_admin)

```
POST   /pesquisas-corporativas                        criar pesquisa
GET    /pesquisas-corporativas                        listar pesquisas do tenant
GET    /pesquisas-corporativas/:slug                  detalhes + blocos + perguntas
PATCH  /pesquisas-corporativas/:slug                  atualizar (titulo, ativa, periodo)
DELETE /pesquisas-corporativas/:slug                  deletar

GET    /pesquisas-corporativas/:slug/respostas        listar respostas
GET    /pesquisas-corporativas/:slug/respostas/metricas  métricas agregadas
DELETE /pesquisas-corporativas/:slug/respostas/:id    soft delete resposta
```

### Público (sem autenticação — link compartilhado)

```
GET    /:tenantSlug/pesquisa-corporativa/:slug        buscar estrutura da pesquisa (blocos + perguntas)
POST   /:tenantSlug/pesquisa-corporativa/:slug        submeter resposta
```

---

## Frontend

### Novas páginas

```
src/pages/pesquisas-corporativas/
  index.tsx           ← gestão: listar pesquisas, ver respostas, métricas
  [slug]/
    index.tsx         ← detalhe: respostas da pesquisa específica

src/pages/pesquisa-publica/
  index.tsx           ← formulário público (sem auth), rota: /:tenantSlug/pesquisa-corporativa/:slug
```

### Rota pública

```
/:tenantSlug/pesquisa-corporativa/:slug   ← link que será enviado aos colaboradores
```

### Navegação

Adicionar item "Pesquisas" no header para roles `rh_admin` e `holding_admin`,
navegando para `/pesquisas-corporativas`.

### Renderização dinâmica do formulário

O frontend carrega os blocos e perguntas via API e renderiza o componente
correto por escala:

| escala | Componente |
|---|---|
| `likert5` | `<Likert5Input />` — 5 botões (Discordo totalmente → Concordo totalmente) |
| `likert3` | `<Likert3Input />` — 3 botões (Ruim / Bom / Ótimo) |
| `nps` | `<NpsInput />` — já existe no sistema de treinamentos |
| `aberta` | `<textarea />` |
| `opcoes` | `<RadioGroup />` — opções vindas do campo `opcoes` da pergunta |
| `multipla` | `<CheckboxGroup />` |
| `booleano` | `<BooleanInput />` — Sim / Não |

---

## Ordem de Execução — Zero Downtime

```
PASSO 1 — Criar entidades e migration no banco
  → Criar as 4 tabelas novas sem tocar nas existentes
  → Risco: nenhum

PASSO 2 — Implementar backend (service + controller + DTOs)
  → Endpoints de gestão e submissão pública
  → Risco: nenhum (tabelas novas, código novo)

PASSO 3 — Rodar seed da pesquisa de clima
  → Popular pesquisas_corporativas + blocos + perguntas com a pesquisa de clima 2026
  → Risco: nenhum

PASSO 4 — Implementar frontend
  → Página de gestão + formulário público
  → Adicionar item de navegação no header
  → Risco: baixo

PASSO 5 — Testar e validar
  → Abrir link público, submeter resposta de teste
  → Verificar métricas no painel de gestão
  → Risco: nenhum
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| JSONB com tipo errado de valor | Baixa | Validação no DTO pelo tipo de escala da pergunta |
| Pesquisa sem blocos sendo publicada | Baixa | Validação no service antes de ativar |
| Respostas duplicadas (reenvio) | Média | Rate limiting no endpoint público (igual ao de treinamentos) |
| Slug duplicado por tenant | Baixa | Unique index (tenantId, slug) |

---

---

# Primeira Pesquisa — Clima Organizacional e Soft Skills 2026

**Titulo:** Pesquisa de Clima e Soft Skills — Mediall 2026
**Slug:** `clima-soft-skills-2026`
**Tipo:** `clima`
**Período:** `2026-S1`
**Tenant:** Mediall (holding — tenantId da Mediall ou null para global)

---

## Metadados do Respondente

Pergunta inicial antes dos blocos — resposta armazenada em `metadados` JSONB:

| Campo | Escala | Opções |
|---|---|---|
| Tempo de empresa | `opcoes` | "Até 6 meses" / "6 meses a 1 ano" / "1 a 3 anos" / "Mais de 3 anos" |

---

## Blocos e Perguntas

### Bloco 1 — Comunicação (escala: `likert5`)

1. Recebo informações claras para realizar meu trabalho
2. A comunicação entre os setores funciona bem
3. Meu líder se comunica de forma clara e respeitosa
4. Sinto que posso expressar minhas opiniões

### Bloco 2 — Liderança (escala: `likert5`)

5. Meu líder demonstra respeito pelos colaboradores
6. Meu líder sabe lidar bem com situações de pressão
7. Recebo feedbacks construtivos sobre meu trabalho
8. Meu líder age de forma justa com a equipe

### Bloco 3 — Inteligência Emocional (escala: `likert5`)

9. As pessoas mantêm o controle emocional no ambiente de trabalho
10. Os conflitos são tratados de forma respeitosa
11. Existe empatia entre os colaboradores
12. Sinto que o ambiente é emocionalmente saudável

### Bloco 4 — Trabalho em Equipe (escala: `likert5`)

13. Existe colaboração entre os colegas
14. As equipes trabalham de forma integrada
15. Posso contar com meus colegas quando preciso
16. O clima entre os colegas é positivo

### Bloco 5 — Adaptabilidade e Mudanças (escala: `likert5`)

17. As equipes lidam bem com mudanças
18. As pessoas estão abertas a novas ideias
19. Mudanças são comunicadas de forma clara
20. Sinto que consigo me adaptar às demandas do trabalho

### Bloco 6 — Foco em Resultados (escala: `likert5`)

21. As pessoas demonstram comprometimento com resultados
22. Existe responsabilidade pelas entregas
23. Os processos ajudam no desempenho do trabalho
24. Sinto que meu trabalho contribui para o resultado da empresa

### Bloco 7 — Cultura e Ambiente (escala: `likert5`)

25. A empresa valoriza as pessoas
26. Sinto orgulho de trabalhar na Mediall
27. O ambiente de trabalho é respeitoso
28. A empresa cuida do bem-estar dos colaboradores

---

## Perguntas Abertas (após os blocos, escala: `aberta`)

29. O que a Mediall faz bem em relação às pessoas?
30. O que precisa melhorar no ambiente de trabalho?
31. O que seu líder poderia fazer melhor?
32. Cite uma situação positiva que você viveu na empresa
33. Cite uma situação que poderia ter sido melhor conduzida

---

## Resumo da Estrutura

| | Total |
|---|---|
| Blocos | 7 |
| Perguntas likert5 | 28 |
| Pergunta de metadado (tempo de empresa) | 1 |
| Perguntas abertas | 5 |
| **Total de perguntas** | **34** |

---

## Escala de Resposta (likert5)

| Valor | Label |
|---|---|
| 1 | Discordo totalmente |
| 2 | Discordo parcialmente |
| 3 | Neutro |
| 4 | Concordo parcialmente |
| 5 | Concordo totalmente |
