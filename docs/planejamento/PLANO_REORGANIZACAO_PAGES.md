# Plano de Reorganização de `src/pages/`

## Motivação

Hoje todas as páginas ficam no mesmo nível em `src/pages/`, sem distinção de domínio. Com o crescimento do sistema, isso torna difícil:

- Saber quais páginas pertencem a qual role de usuário
- Encontrar arquivos rapidamente
- Onboarding de novos devs

Além disso, alguns arquivos cresceram demais:

| Arquivo | Linhas |
|---|---|
| `treinamentos/index.tsx` | 1200 |
| `admin-usuarios/index.tsx` | 565 |
| `pesquisas-corporativas/index.tsx` | 551 |
| `treinamento/index.tsx` | 593 |
| `rh-usuarios/index.tsx` | 431 |

---

## Estrutura Proposta

```
src/pages/
│
├── auth/                            ← sem role (público)
│   ├── login/
│   │   └── index.tsx
│   └── change-password/
│       └── index.tsx
│
├── paciente/                        ← roles: operator_forms, hospital_admin, holding_admin
│   ├── pesquisa/
│   │   └── index.tsx                (era pesquisa.tsx — arquivo solto)
│   ├── survey/
│   │   ├── index.tsx
│   │   └── survey-preview.tsx
│   ├── dashboard/
│   │   └── index.tsx
│   └── analytics/
│       └── index.tsx
│
├── rh/                              ← role: rh_admin
│   ├── treinamentos/
│   │   ├── index.tsx                (orquestra, estado principal)
│   │   ├── session-table.tsx        (tabela de sessões)
│   │   ├── session-form-modal.tsx   (modal criar/editar sessão)
│   │   └── session-detail.tsx       (detalhes e respostas)
│   ├── treinamento/
│   │   └── index.tsx                (formulário público — link externo)
│   ├── pesquisas-corporativas/
│   │   ├── index.tsx                (orquestra, estado principal)
│   │   ├── pesquisa-table.tsx       (tabela de pesquisas)
│   │   ├── pesquisa-form-modal.tsx  (modal criar/editar)
│   │   └── pesquisa-respostas.tsx   (visualização de respostas)
│   ├── pesquisa-corporativa/
│   │   └── index.tsx                (formulário público — link externo)
│   └── rh-usuarios/
│       └── index.tsx
│
├── admin/                           ← role: holding_admin
│   └── admin-usuarios/
│       └── index.tsx
│
└── home/
    └── index.tsx
```

---

## O que Muda no `App.tsx`

Apenas os imports — as **rotas não mudam**:

```ts
// ANTES
import SurveyForm3 from "@/pages/survey";
import Pesquisa from "@/pages/pesquisa";
import Dashboard from "@/pages/dashboard";
import Analytics3 from "@/pages/analytics";
import Form3Preview from "@/pages/survey/survey-preview";
import Treinamentos from "@/pages/treinamentos";
import TrainingSurvey from "@/pages/treinamento";
import RhUsuarios from "@/pages/rh-usuarios";
import AdminUsuarios from "@/pages/admin-usuarios";
import PesquisasCorporativas from "@/pages/pesquisas-corporativas";
import PesquisaCorporativaPublica from "@/pages/pesquisa-corporativa";
import Login from "@/pages/login";
import ChangePassword from "@/pages/change-password";

// DEPOIS
import SurveyForm3 from "@/pages/paciente/survey";
import Pesquisa from "@/pages/paciente/pesquisa";
import Dashboard from "@/pages/paciente/dashboard";
import Analytics3 from "@/pages/paciente/analytics";
import Form3Preview from "@/pages/paciente/survey/survey-preview";
import Treinamentos from "@/pages/rh/treinamentos";
import TrainingSurvey from "@/pages/rh/treinamento";
import RhUsuarios from "@/pages/rh/rh-usuarios";
import AdminUsuarios from "@/pages/admin/admin-usuarios";
import PesquisasCorporativas from "@/pages/rh/pesquisas-corporativas";
import PesquisaCorporativaPublica from "@/pages/rh/pesquisa-corporativa";
import Login from "@/pages/auth/login";
import ChangePassword from "@/pages/auth/change-password";
```

---

## Split Interno do `treinamentos/index.tsx` (1200 linhas)

O arquivo atual mistura responsabilidades distintas. A proposta é extrair:

| Componente novo | Responsabilidade |
|---|---|
| `session-table.tsx` | Renderização e sorting da tabela de sessões |
| `session-form-modal.tsx` | Formulário de criação/edição de sessão |
| `session-detail.tsx` | Modal ou painel de detalhes e listagem de respostas |
| `index.tsx` | Estado global, queries, orquestração |

O mesmo padrão se aplica ao `pesquisas-corporativas/index.tsx` (551 linhas):

| Componente novo | Responsabilidade |
|---|---|
| `pesquisa-table.tsx` | Tabela de pesquisas |
| `pesquisa-form-modal.tsx` | Modal criar/editar pesquisa e perguntas |
| `pesquisa-respostas.tsx` | Visualização de respostas |
| `index.tsx` | Estado, queries, orquestração |

---

## Etapas de Execução

### Etapa 1 — Mover arquivos (sem alterar conteúdo) ✅ CONCLUÍDA
1. ✅ Criar pastas: `auth/`, `paciente/`, `rh/`, `admin/`
2. ✅ Mover cada arquivo para o destino
3. ✅ Atualizar imports no `App.tsx`
4. ✅ Verificar se há outros arquivos que importam de `pages/` (componentes, hooks)
5. ✅ Rodar build — zero erros

### Etapa 2 — Split do `treinamentos/index.tsx` ✅ CONCLUÍDA
1. ✅ Ler o arquivo e mapear blocos por responsabilidade
2. ✅ Extrair `session-constants.ts` (constantes de perguntas e labels)
3. ✅ Extrair `session-form-modal.tsx` (SessionForm + ConfirmDelete)
4. ✅ Extrair `session-detail.tsx` (ResponseRow, QuestionAnalytics, ResponsesPanel)
5. ✅ Extrair `session-table.tsx` (PairedSessionCard, SessionCard, helpers de agrupamento)
6. ✅ Limpar `index.tsx` para somente orquestração (~170 linhas)
7. ✅ Rodar build — zero erros

### Etapa 3 — Split do `pesquisas-corporativas/index.tsx` ✅ CONCLUÍDA
1. ✅ Extrair `pesquisa-table.tsx` (PesquisaCard)
2. ✅ Extrair `pesquisa-form-modal.tsx` (EditModal)
3. ✅ Extrair `pesquisa-respostas.tsx` (RespostaRow, QuestionAnalytics, ResponsesPanel)
4. ✅ Limpar `index.tsx` para somente orquestração (~145 linhas)
5. ✅ Rodar build — zero erros

---

## Critério de Sucesso

- `npm run build` sem erros após cada etapa
- Nenhuma rota muda (`/treinamentos`, `/:tenantSlug/pesquisas-corporativas`, etc.)
- Nenhum comportamento funcional muda — refactor puro
- `treinamentos/index.tsx` fica abaixo de 300 linhas
- `pesquisas-corporativas/index.tsx` fica abaixo de 200 linhas
