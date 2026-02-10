# Estrutura do Projeto

## 📂 Arquitetura de Pastas

```
projetoForms/
├── public/                    # Arquivos estáticos
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── button.tsx       # Botão com variantes (CVA)
│   │   ├── card.tsx         # Container com sombras
│   │   ├── input.tsx        # Input com label e validação
│   │   ├── select.tsx       # Select estilizado
│   │   ├── text.tsx         # Componente tipográfico
│   │   └── textarea.tsx     # Área de texto
│   │
│   ├── contexts/             # Contextos React
│   │   └── auth-context.tsx # Autenticação e estado do usuário
│   │
│   ├── pages/                # Páginas da aplicação
│   │   ├── home.tsx         # Página inicial
│   │   ├── login.tsx        # Login administrativo
│   │   ├── survey-form.tsx  # Formulário de pesquisa
│   │   ├── dashboard.tsx    # Dashboard com filtros
│   │   └── analytics.tsx    # BI com gráficos
│   │
│   ├── services/             # Lógica de negócio
│   │   └── form-service.ts  # CRUD e métricas
│   │
│   ├── types/                # TypeScript types
│   │   └── index.ts         # Interfaces e tipos
│   │
│   ├── utils/                # Funções utilitárias
│   │   ├── format.ts        # Formatação de datas/números
│   │   └── seed-data.ts     # Dados de exemplo
│   │
│   ├── App.tsx               # Rotas e providers
│   ├── main.tsx              # Entry point
│   ├── index.css             # Tema Tailwind
│   └── vite-env.d.ts         # Type definitions
│
├── index.html                # HTML template
├── package.json              # Dependências
├── tsconfig.json             # Config TypeScript
├── vite.config.ts            # Config Vite
├── tailwind.config.ts        # Config Tailwind
└── eslint.config.js          # Config ESLint
```

## 🎯 Padrões Utilizados

### 1. **Componentes com CVA (class-variance-authority)**
```typescript
// Exemplo: components/button.tsx
export const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      primary: "...",
      secondary: "..."
    }
  }
})
```

### 2. **Context Pattern**
```typescript
// contexts/auth-context.tsx
export function AuthProvider({ children }) {
  // Estado centralizado
  return <AuthContext.Provider>...</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### 3. **Service Layer**
```typescript
// services/form-service.ts
export const formService = {
  getAll: () => {...},
  create: () => {...},
  filter: () => {...}
}
```

### 4. **Protected Routes**
```typescript
// App.tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  return children
}
```

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────┐
│           localStorage (Database)            │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│        form-service.ts (Service Layer)       │
│  • getAll()  • create()  • filter()         │
│  • getMetrics()                             │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│         Pages (UI Components)                │
│  • Dashboard  • Analytics  • Survey          │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│      Reusable Components (UI Layer)          │
│  • Button  • Input  • Card  • Text          │
└─────────────────────────────────────────────┘
```

## 🎨 Design System

### Cores
```css
Gray:   #f7f3f6 → #332e32 (claro → escuro)
Blue:   #cce5ff → #2c5aa0 (primária)
Green:  #cddfcc → #2f5c2d (sucesso)
Pink:   #e9cce1 → #884074 (destaque)
Red:    #ffcccc → #c0392b (erro)
Yellow: #fff9cc → #d4ac0d (aviso)
```

### Tipografia
```
Heading-lg:     4xl, bold
Heading-md:     2xl, bold
Heading-sm:     xl, semibold
Body-lg:        lg, normal
Body-md:        base, normal
Body-sm:        sm, normal
Caption:        xs, normal
```

### Componentes
- **Botão:** 5 variantes, 3 tamanhos
- **Input:** Com label e erro
- **Select:** Estilizado custom
- **Card:** Com padding e sombra
- **Text:** Polimórfico (as="tag")

## 🔐 Autenticação

**Credenciais de teste:**
- Email: `admin@hospital.com`
- Senha: `admin123`

**Fluxo:**
1. Login → AuthContext salva no localStorage
2. ProtectedRoute verifica autenticação
3. Logout limpa localStorage

## 📊 Gráficos (Recharts)

- **BarChart:** Departamentos, satisfação, categorias
- **LineChart:** Tendência mensal
- **PieChart:** Taxa de recomendação

## 🛠️ Manutenção

### Adicionar nova página:
1. Criar em `src/pages/nova-pagina.tsx`
2. Adicionar rota em `App.tsx`
3. (Opcional) Proteger com `<ProtectedRoute>`

### Adicionar novo componente:
1. Criar em `src/components/componente.tsx`
2. Usar CVA para variantes
3. Tipar props com TypeScript
4. Exportar como default

### Adicionar nova métrica:
1. Adicionar ao type em `src/types/index.ts`
2. Implementar cálculo em `form-service.ts`
3. Exibir em `analytics.tsx` ou `dashboard.tsx`

## 🚀 Comandos

```bash
npm install          # Instalar dependências
npm run dev         # Dev server
npm run build       # Build produção
npm run preview     # Preview build
npm run lint        # ESLint
```

## 📝 Checklist de Qualidade

- ✅ TypeScript em 100% do código
- ✅ Componentes reutilizáveis
- ✅ Separação de responsabilidades
- ✅ Service layer isolada
- ✅ Context para estado global
- ✅ Protected routes
- ✅ Validação de formulários
- ✅ Responsivo (mobile-first)
- ✅ Acessibilidade (labels, semântica)
- ✅ Dados de exemplo (seed)

## 🎓 Conceitos Rocketseat

- **Clean Code:** Nomes descritivos, funções pequenas
- **SOLID:** Single responsibility, separação de camadas
- **Componentização:** Reusabilidade e composição
- **TypeScript:** Type safety em toda aplicação
- **Tailwind:** Utility-first CSS
- **React Hooks:** useState, useEffect, useContext
- **React Router:** SPA com rotas protegidas
- **Context API:** Estado global sem props drilling
