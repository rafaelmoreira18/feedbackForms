# Estrutura do Projeto

## 📂 Arquitetura de Pastas

```
feedbackforms/
├── public/                          # Arquivos estáticos
├── src/                             # Frontend (React + Vite)
│   ├── components/                  # Componentes reutilizáveis
│   │   ├── button.tsx              # Botão com variantes (CVA)
│   │   ├── card.tsx                # Container com sombras
│   │   ├── date-input.tsx          # Input de data estilizado
│   │   ├── header.tsx              # Cabeçalho com logo do tenant
│   │   ├── input.tsx               # Input com label e validação
│   │   ├── select.tsx              # Select estilizado
│   │   ├── sub-reason-panel.tsx    # Painel de sub-razões (Form 1)
│   │   ├── text.tsx                # Componente tipográfico
│   │   ├── textarea.tsx            # Área de texto
│   │   └── form3/                  # Componentes exclusivos do Form 3
│   │       ├── nps-input.tsx       # Seletor NPS 0–10
│   │       ├── rating4-input.tsx   # Escala 4 pontos (Ruim/Regular/Bom/Excelente)
│   │       └── section-header.tsx  # Cabeçalho de seção
│   │
│   ├── contexts/                    # Contextos React
│   │   └── auth-context.tsx        # Autenticação JWT e estado do usuário
│   │
│   ├── hooks/                       # Custom hooks
│   │   └── useForm3.ts             # Hook de estado/navegação do Form 3
│   │
│   ├── pages/                       # Páginas da aplicação
│   │   ├── home.tsx                # Página inicial
│   │   ├── login.tsx               # Login administrativo
│   │   ├── pesquisa.tsx            # Formulário legado (Form 1 — satisfação)
│   │   ├── dashboard.tsx           # Dashboard com filtros
│   │   ├── survey-form3.tsx        # Form 3 — formulário dinâmico por departamento
│   │   ├── analytics3.tsx          # BI / analytics do Form 3
│   │   └── form3-preview.tsx       # Visualização individual de resposta Form 3
│   │
│   ├── services/                    # Camada de serviços (chamadas à API)
│   │   ├── api.ts                  # Axios base + interceptors JWT
│   │   ├── analytics3-service.ts   # Métricas e gráficos Form 3
│   │   ├── form3-service.ts        # CRUD respostas Form 3
│   │   ├── report-service.ts       # Geração de relatórios
│   │   └── tenant-service.ts       # Busca tenant por slug
│   │
│   ├── types/                       # TypeScript types
│   │   └── index.ts                # Todas as interfaces e tipos
│   │
│   ├── utils/                       # Funções utilitárias
│   │   └── format.ts               # formatDate, formatRating, formatDateTime
│   │
│   ├── routes.ts                    # Constantes de rotas
│   ├── App.tsx                      # Rotas e providers
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Tema Tailwind
│   └── vite-env.d.ts               # Type definitions
│
├── backend/                         # Backend (NestJS + TypeORM + PostgreSQL)
│   └── src/
│       ├── app.module.ts            # Módulo raiz
│       ├── main.ts                  # Servidor NestJS
│       ├── common/
│       │   ├── decorators/
│       │   │   ├── roles.decorator.ts
│       │   │   └── tenant.decorator.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── interceptors/
│       │   │   ├── logging.interceptor.ts
│       │   │   └── transform.interceptor.ts
│       │   └── validators/
│       │       ├── cpf.validator.ts
│       │       └── cpf.validator.spec.ts
│       ├── database/
│       │   ├── data-source.ts       # TypeORM DataSource (conexão RDS)
│       │   └── seeds/
│       │       └── seed-first-tenant.ts  # Seed: tenant hgm + 7 templates
│       └── modules/
│           ├── auth/                # JWT auth (login, strategy)
│           ├── tenants/             # TenantEntity, TenantService
│           ├── user/                # UserEntity, UserService, UserController
│           ├── form-templates/      # FormTemplateEntity, blocos, questões
│           └── forms/               # Form3ResponseEntity, FormsService, FormsController
│               ├── forms.entity.ts
│               ├── forms.service.ts
│               ├── forms.controller.ts
│               ├── forms.service.spec.ts
│               └── tenant-isolation.spec.ts
│
├── index.html                       # HTML template
├── package.json                     # Dependências frontend
├── tsconfig.json                    # Config TypeScript
├── vite.config.ts                   # Config Vite
├── tailwind.config.ts               # Config Tailwind
└── eslint.config.js                 # Config ESLint
```

## 🗄️ Banco de Dados

- **Servidor**: AWS RDS `dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com`
- **Database**: `feedbackforms`
- **Multi-tenancy**: Row-level — coluna `tenant_id` em todas as tabelas tenant-scoped

### Tabelas

```
tenants               — id, slug, name, logoUrl, active
users                 — id, email, name, password, role, tenantId (FK → tenants)
form_templates        — id, tenantId (FK), slug, name, active
form_template_blocks  — id, templateId (FK), title, order
form_questions        — id, blockId (FK), questionKey, text, scale, subReasons(JSONB), order
form3_responses       — id, tenantId (FK), formType, patientName, patientCpf, answers(JSONB), ...
```

## 📋 Formulários

| Form | Rota | Descrição | Escala |
|------|------|-----------|--------|
| Form 1 (legado) | `/pesquisa` | Satisfação do paciente | 1–5 + booleanos |
| Form 3 | `/survey3` | Formulários dinâmicos por departamento | 4 pontos + NPS 0–10 |

### Departamentos do Form 3

Internação Hospitalar, Exames Laboratoriais e de Imagem, Ambulatório, UTI, Pronto Socorro, Hemodiálise, Centro Cirúrgico

### Estrutura das Respostas (Form 3)

```json
answers: [
  { "questionId": "q1", "value": 3 },
  { "questionId": "nps", "value": 9 }
]
```

## 🔌 API Routes

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/tenants/:slug/form-templates` | Pública | Listar templates |
| POST | `/api/tenants/:slug/form-templates` | JWT | Criar template |
| POST | `/api/tenants/:slug/forms3` | Pública | Submeter resposta |
| GET | `/api/tenants/:slug/forms3` | JWT | Listar respostas |
| GET | `/api/tenants/:slug/forms3/metrics` | JWT | Métricas analytics |
| GET | `/api/tenants/:slug/forms3/:id` | JWT | Resposta individual |
| POST | `/api/auth/login` | Pública | Login JWT |

## 🎯 Padrões Utilizados

### 1. **Componentes com CVA (class-variance-authority)**
```typescript
export const buttonVariants = cva("base-classes", {
  variants: {
    variant: { primary: "...", secondary: "..." }
  }
})
```

### 2. **Context Pattern**
```typescript
// contexts/auth-context.tsx
export function AuthProvider({ children }) { ... }
export function useAuth() { return useContext(AuthContext) }
```

### 3. **Service Layer**
```typescript
// services/form3-service.ts
export const form3Service = {
  submit: (tenantSlug, data) => {...},
  getAll: (tenantSlug, filters) => {...},
}
```

### 4. **Protected Routes**
```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  return children
}
```

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│        PostgreSQL (AWS RDS — feedbackforms)      │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│         NestJS Backend (modules/forms)           │
│  • FormsController  • FormsService              │
│  • FormTemplateController  • TenantService      │
└─────────────────────────────────────────────────┘
                        ↕ HTTP/REST
┌─────────────────────────────────────────────────┐
│     Services Frontend (services/*.ts)            │
│  • api.ts  • form3-service.ts                   │
│  • analytics3-service.ts  • tenant-service.ts   │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│         Pages + Hooks (UI)                       │
│  • survey-form3.tsx + useForm3.ts               │
│  • analytics3.tsx  • dashboard.tsx              │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│      Reusable Components (UI Layer)              │
│  • Button  • Input  • Card  • form3/*           │
└─────────────────────────────────────────────────┘
```

## 🔐 Autenticação

**Credenciais padrão (tenant hgm):**
- Email: `admin@hgm.com`
- Senha: `Admin@123`

**Fluxo:**
1. `POST /api/auth/login` → retorna JWT
2. AuthContext armazena token no localStorage
3. `api.ts` injeta `Authorization: Bearer <token>` via interceptor
4. `JwtAuthGuard` protege rotas administrativas no backend

## 🎨 Design System

### Cores
```css
Gray:   #f7f3f6 → #332e32
Blue:   #cce5ff → #2c5aa0 (primária)
Green:  #cddfcc → #2f5c2d (sucesso)
Pink:   #e9cce1 → #884074 (destaque)
Red:    #ffcccc → #c0392b (erro)
Yellow: #fff9cc → #d4ac0d (aviso)
```

### Escala Form 3 (4 pontos)
```
1 → Ruim        2 → Regular       3 → Bom        4 → Excelente
```

## 🚀 Comandos

### Frontend
```bash
npm install        # Instalar dependências
npm run dev        # Dev server (porta 5173)
npm run build      # Build produção
npm run lint       # ESLint
```

### Backend
```bash
cd backend
npm install        # Instalar dependências
npm run start:dev  # Dev server (porta 3000)
npm run seed:first-tenant  # Seed tenant hgm
npm run test       # Testes unitários
```

## 📝 Checklist de Qualidade

- ✅ TypeScript em 100% do código
- ✅ Componentes reutilizáveis com CVA
- ✅ Service layer isolada
- ✅ Context para estado global (auth)
- ✅ Protected routes
- ✅ Multi-tenancy via tenant_id (row-level)
- ✅ JWT authentication
- ✅ Validação de formulários (CPF, campos obrigatórios)
- ✅ Responsivo (mobile-first)
- ✅ Testes de isolamento de tenant
