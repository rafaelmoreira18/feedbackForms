# FeedbackForms — Plano de Integração e Arquitetura
**Branch de trabalho:** `development` (criar antes de começar)
**Data:** 2026-03-19

---

## Contexto

FeedbackForms é uma SPA React + Vite. O backend NestJS será **descartado** — toda
a lógica de API migra para o Next.js do LinenSistem. Esta SPA passa a consumir
as API routes do LinenSistem em vez do NestJS.

A SPA **não será migrada para Next.js** — mantém React + Vite puro.
O que muda aqui é: organização interna da SPA + apontar para o novo backend.

---

## Arquitetura de Pastas — Estado Ideal

A estrutura atual está razoável mas pode ser muito melhorada. Toda nova feature
deve seguir este padrão.

```
feedbackforms/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.ts                     ← definição centralizada de rotas
│   ├── index.css
│   │
│   ├── assets/                       ← imagens, logos, ícones estáticos
│   │   └── Logo_mediall.png
│   │
│   ├── components/                   ← componentes reutilizáveis
│   │   ├── ui/                       ← primitivos genéricos (sem lógica de negócio)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── text.tsx
│   │   │   ├── date-input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── modal/
│   │   │       ├── modal.tsx          ← modal base com portal
│   │   │       └── modal-confirm.tsx  ← modal de confirmação genérico
│   │   │
│   │   ├── layout/                   ← estrutura de página
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── page-wrapper.tsx
│   │   │
│   │   ├── forms/                    ← componentes específicos de formulário de pesquisa
│   │   │   ├── nps-input.tsx
│   │   │   ├── rating4-input.tsx
│   │   │   ├── section-header.tsx
│   │   │   └── sub-reason-panel.tsx
│   │   │
│   │   └── charts/                   ← componentes de gráficos/analytics
│   │       ├── bar-chart.tsx
│   │       ├── pie-chart.tsx
│   │       └── line-chart.tsx
│   │
│   ├── pages/                        ← uma pasta por página, com seus sub-componentes
│   │   ├── home/
│   │   │   └── index.tsx             ← renomear home.tsx
│   │   ├── login/
│   │   │   └── index.tsx
│   │   ├── survey/
│   │   │   ├── index.tsx             ← survey-form3.tsx
│   │   │   └── survey-preview.tsx    ← form3-preview.tsx
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── components/           ← componentes exclusivos desta página
│   │   │   │   ├── kpi-card.tsx
│   │   │   │   └── response-table.tsx
│   │   │   └── hooks/
│   │   │       └── use-dashboard.ts
│   │   └── analytics/
│   │       ├── index.tsx             ← analytics3.tsx
│   │       └── components/
│   │           ├── period-chart.tsx
│   │           └── department-chart.tsx
│   │
│   ├── contexts/                     ← contextos React globais
│   │   └── auth-context.tsx
│   │
│   ├── hooks/                        ← hooks reutilizáveis globais
│   │   ├── use-auth.ts               ← consome auth-context
│   │   ├── use-form3.ts              ← lógica do formulário de pesquisa
│   │   ├── use-tenant.ts             ← NOVO: dados do tenant atual
│   │   └── use-analytics.ts          ← NOVO: dados de analytics
│   │
│   ├── services/                     ← chamadas HTTP para o backend
│   │   ├── api.ts                    ← instância axios/fetch com baseURL e auth header
│   │   ├── auth.service.ts           ← login, logout, refresh
│   │   ├── form-response.service.ts  ← submit e listagem de respostas
│   │   ├── form-template.service.ts  ← templates de formulário
│   │   ├── analytics.service.ts      ← KPIs e agregações
│   │   ├── tenant.service.ts         ← dados de tenant
│   │   └── report.service.ts         ← geração de PDF
│   │
│   ├── types/
│   │   └── index.ts                  ← todos os tipos TypeScript do projeto
│   │
│   └── utils/
│       ├── format.ts                 ← formatações de data, número, CPF
│       └── validators.ts             ← validação de CPF, email, etc.
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── .env.example
├── .env.development                  ← VITE_API_URL=http://localhost:3000/api
├── .env.production                   ← VITE_API_URL=https://seudominio.com/api
└── package.json
```

> O diretório `backend/` será mantido no repositório por enquanto mas não receberá
> mais desenvolvimento. Será removido após migração validada em produção.

---

## Boas Práticas — Regras de Arquitetura

### 1. Separação de responsabilidades

```
Page (index.tsx)
  └── consome hooks/
        └── chama services/
              └── chama /api no Next.js backend
```

- **Pages** — orquestram layout e compõem componentes. Sem lógica de negócio.
- **Components** — recebem props e renderizam. Sem chamadas fetch.
- **Hooks** — encapsulam estado + React Query. São a ponte entre páginas e services.
- **Services** — funções puras que fazem fetch. Sem estado.

### 2. React Query em tudo que é async

Não usar `useEffect` + `useState` para fetch. Usar TanStack React Query:

```ts
// hooks/use-analytics.ts
export function useAnalyticsSummary(tenantId: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', tenantId],
    queryFn: () => analyticsService.getSummary(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

### 3. Convenções de nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componente React | PascalCase | `ModalConfirm.tsx` |
| Hook | camelCase + `use` | `useFormResponse.ts` |
| Service | kebab-case + `.service.ts` | `form-response.service.ts` |
| Page | pasta + `index.tsx` | `pages/dashboard/index.tsx` |
| Context | kebab-case + `-context.tsx` | `auth-context.tsx` |

### 4. Tipagem estrita

- **Sem `any`**. Nunca.
- Todos os tipos de resposta da API ficam em `types/index.ts`.
- O tipo `JWTPayload` deve ser idêntico ao do LinenSistem:

```ts
// types/index.ts
export interface JWTPayload {
  sub: string
  email: string
  nome: string
  role: 'super_admin' | 'tenant_admin' | 'viewer'
  tenantId: string | null
  tenantSlug: string | null
}
```

### 5. Instância de API centralizada

Toda chamada HTTP passa por `services/api.ts`. Nunca usar fetch/axios diretamente
em componentes ou hooks sem passar por esta camada.

```ts
// services/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 6. Variáveis de ambiente

Toda URL de API via `import.meta.env.VITE_API_URL`. Nunca hardcodar domínios.

```
# .env.development
VITE_API_URL=http://localhost:3000/api

# .env.production
VITE_API_URL=https://feedback.seudominio.com/api
```

### 7. Modais

- Modais ficam em `components/ui/modal/`
- Controlados por estado local (`useState`) na página que os usa
- Usar React Portal para renderizar fora da árvore do componente pai
- Fechar com Escape e clique no backdrop

### 8. Estrutura de página com sub-componentes

Quando uma página tem componentes que não fazem sentido em outro lugar,
eles ficam dentro da própria pasta da página:

```
pages/dashboard/
├── index.tsx            ← página principal
├── components/
│   ├── kpi-card.tsx     ← só existe nesta página
│   └── response-table.tsx
└── hooks/
    └── use-dashboard.ts ← lógica específica desta página
```

### 9. Tratamento de erros padronizado

```ts
// React Query cuida disso, mas para mutations:
const mutation = useMutation({
  mutationFn: formResponseService.submit,
  onSuccess: () => toast.success('Pesquisa enviada!'),
  onError: (error) => toast.error('Erro ao enviar. Tente novamente.'),
})
```

Nunca mostrar mensagem de erro técnica para o usuário final.

### 10. Organização de imports

```ts
// 1. React
import { useState, useEffect } from 'react'

// 2. Libs externas
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

// 3. Serviços e hooks internos
import { useAuth } from '@/hooks/use-auth'
import { analyticsService } from '@/services/analytics.service'

// 4. Componentes
import { Button } from '@/components/ui/button'
import { KpiCard } from './components/kpi-card'

// 5. Types
import type { AnalyticsSummary } from '@/types'
```

Configurar path alias `@/` no `tsconfig.app.json` e `vite.config.ts`.

---

## Rastreabilidade de Usuário na SPA

A SPA não escreve `criadoPorId` diretamente — isso é responsabilidade do backend.
O que a SPA **deve** garantir:

1. **Sempre enviar o token JWT** nas requisições autenticadas (via interceptor)
2. **Nunca enviar `userId` no body da request** — o backend extrai do token
3. **Submit público da pesquisa** — não envia token, `criadoPorId` fica null no banco

```ts
// CORRETO — SPA envia só os dados, backend adiciona criadoPorId
await formResponseService.submit({
  nomePaciente: 'João',
  respostas: [...],
  // SEM userId aqui
})

// ERRADO
await formResponseService.submit({
  nomePaciente: 'João',
  criadoPorId: user.id,  // nunca isso
})
```

---

## Organização do Deploy — SPA

### Build e deploy

```bash
# 1. Build
npm run build
# gera dist/ com todos os assets

# 2. Nginx serve dist/ como estático
# Ver configuração no INTEGRATION_PLAN do LinenSistem
```

### Variáveis de ambiente

```env
# .env.development
VITE_API_URL=http://localhost:3000/api

# .env.production
VITE_API_URL=https://linen.seudominio.com/api
```

### Checklist de deploy da SPA

- [ ] `npm run build` sem erros de TypeScript
- [ ] `dist/` copiado para `/opt/plataforma/feedbackforms/dist/`
- [ ] Nginx configurado com `try_files $uri /index.html` (SPA fallback)
- [ ] SSL ativo no subdomínio `feedback.seudominio.com`
- [ ] Testar login → token funciona → chamadas API retornam 200

---

## Tasks de Integração — FeedbackForms SPA

### FASE 0 — Setup da branch

- [ ] **TASK 0.1** — Criar branch `development`
  ```bash
  git checkout -b development
  ```

### FASE 1 — Apontar para o novo backend

- [ ] **TASK 1.1** — Criar `.env.development` e `.env.production`
  ```
  VITE_API_URL=http://localhost:3000/api   # development
  VITE_API_URL=https://seudominio.com/api  # production
  ```

- [ ] **TASK 1.2** — Atualizar `services/api.ts`
  - Trocar baseURL hardcoded por `import.meta.env.VITE_API_URL`
  - Garantir que interceptor de auth está correto

- [ ] **TASK 1.3** — Atualizar `services/auth.service.ts`
  - Endpoint de login: `POST /api/auth/login` (mesmo do LinenSistem)
  - Verificar que o shape de resposta do Next.js é compatível

- [ ] **TASK 1.4** — Atualizar `services/form3-service.ts`
  - Trocar endpoint `/forms` (NestJS) por `/api/feedback/form-responses` (Next.js)

- [ ] **TASK 1.5** — Atualizar `services/analytics3-service.ts`
  - Trocar endpoints de analytics para `/api/feedback/analytics/*`

- [ ] **TASK 1.6** — Atualizar `services/tenant-service.ts`
  - Endpoint: `/api/tenants/:slug`

- [ ] **TASK 1.7** — Testar fluxo completo em desenvolvimento
  - Login → token JWT → submit pesquisa → dashboard → analytics

### FASE 2 — Reorganização da arquitetura (boas práticas)

- [ ] **TASK 2.1** — Configurar path alias `@/` no tsconfig e vite.config

- [ ] **TASK 2.2** — Reorganizar `components/` em `ui/`, `layout/`, `forms/`, `charts/`
  - Mover arquivos existentes
  - Atualizar imports

- [ ] **TASK 2.3** — Reorganizar `pages/` — cada página vira pasta com `index.tsx`
  - `home.tsx` → `pages/home/index.tsx`
  - `login.tsx` → `pages/login/index.tsx`
  - `survey-form3.tsx` → `pages/survey/index.tsx`
  - `dashboard.tsx` → `pages/dashboard/index.tsx`
  - `analytics3.tsx` → `pages/analytics/index.tsx`

- [ ] **TASK 2.4** — Criar `hooks/use-auth.ts` que consome `auth-context.tsx`

- [ ] **TASK 2.5** — Criar `hooks/use-tenant.ts`

- [ ] **TASK 2.6** — Criar `hooks/use-analytics.ts` com React Query

- [ ] **TASK 2.7** — Criar `components/ui/modal/modal.tsx` com portal

- [ ] **TASK 2.8** — Atualizar `types/index.ts` com tipo `JWTPayload` unificado

### FASE 3 — Compatibilidade de roles

- [ ] **TASK 3.1** — Atualizar guards/verificações de role na SPA
  - Aceitar `"super_admin"` como equivalente a `"holding_admin"` nas verificações de permissão
  - Ou padronizar para `"super_admin"` em todo o código da SPA

- [ ] **TASK 3.2** — Testar login com usuário `super_admin` (token vindo do LinenSistem)

### FASE 4 — Build e deploy

- [ ] **TASK 4.1** — Testar build de produção
  ```bash
  npm run build
  ```

- [ ] **TASK 4.2** — Validar que `dist/` funciona corretamente com o Nginx

- [ ] **TASK 4.3** — Criar `nginx.conf` de exemplo para servir os arquivos estáticos

---

## Endpoints que a SPA consome — Mapeamento

| Funcionalidade | Endpoint antigo (NestJS) | Endpoint novo (Next.js) |
|---|---|---|
| Login | `POST /api/auth/login` | `POST /api/auth/login` ✓ (mesmo) |
| Tenant por slug | `GET /api/tenants/:slug` | `GET /api/tenants/:slug` |
| Listar tenants | `GET /api/tenants` | `GET /api/tenants` |
| Submit pesquisa | `POST /api/forms` | `POST /api/feedback/form-responses` |
| Listar respostas | `GET /api/forms` | `GET /api/feedback/form-responses` |
| Templates | `GET /api/form-templates` | `GET /api/feedback/form-templates` |
| Analytics summary | `GET /api/analytics/summary` | `GET /api/feedback/analytics/summary` |
| Analytics período | `GET /api/analytics/by-period` | `GET /api/feedback/analytics/by-period` |
| Analytics setor | `GET /api/analytics/by-department` | `GET /api/feedback/analytics/by-department` |

---

## JWT Payload — Contrato compartilhado

```ts
interface JWTPayload {
  sub: string        // userId
  email: string
  nome: string
  role: 'super_admin' | 'tenant_admin' | 'viewer'
  tenantId: string | null   // null = super_admin
  tenantSlug: string | null
}
```

Token gerado pelo LinenSistem, consumido pela SPA FeedbackForms.
Mesmo `JWT_SECRET` em ambos os projetos.

---

## Ordem de execução

1. FASE 0 — Branch development
2. FASE 1 — Apontar para novo backend (depende das API routes do LinenSistem estarem prontas)
3. FASE 2 — Reorganização arquitetural (pode ser feito em paralelo com FASE 1)
4. FASE 3 — Compatibilidade de roles
5. FASE 4 — Build e deploy

---

*Ver também: `c:\Users\rafae\projects\linensistem\INTEGRATION_PLAN.md` para as tasks do backend.*
