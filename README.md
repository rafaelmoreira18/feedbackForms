# Sistema de Pesquisa de Satisfação Hospitalar

Sistema completo para gerenciamento de pesquisas de satisfação de pacientes hospitalares, desenvolvido com React, TypeScript e seguindo as melhores práticas de clean code e arquitetura.

## 🚀 Tecnologias

- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS v4** - Framework CSS utilitário
- **React Router DOM** - Roteamento
- **Recharts** - Biblioteca de gráficos
- **class-variance-authority** - Gerenciamento de variantes de componentes
- **date-fns** - Manipulação de datas

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis (Button, Input, Card, etc)
├── contexts/        # Contextos React (AuthContext)
├── pages/           # Páginas da aplicação
├── services/        # Serviços e lógica de negócio
├── types/           # Definições de tipos TypeScript
├── utils/           # Funções utilitárias
├── App.tsx          # Componente principal com rotas
├── main.tsx         # Entry point da aplicação
└── index.css        # Estilos globais e tema Tailwind
```

## 🎯 Funcionalidades

### 1. Formulário de Pesquisa
- Coleta de dados do paciente (nome, idade, gênero, datas)
- Avaliação por departamento
- Sistema de avaliação por estrelas (1-5)
- Múltiplas categorias de avaliação:
  - Satisfação geral
  - Qualidade do atendimento médico
  - Qualidade do atendimento de enfermagem
  - Qualidade das instalações
  - Tempo de espera
  - Qualidade da comunicação
- Indicação de recomendação
- Campo de comentários adicionais

### 2. Sistema de Login
- Autenticação de usuários
- Proteção de rotas administrativas
- Persistência de sessão via localStorage
- **Credenciais de teste:**
  - Email: `admin@hospital.com`
  - Senha: `admin123`

### 3. Dashboard Administrativo
- Visualização de todas as respostas
- Métricas principais:
  - Total de respostas
  - Satisfação média
  - Taxa de recomendação
  - Comparativo mensal
- Filtros avançados:
  - Por data (início e fim)
  - Por departamento
  - Por nível de satisfação
- Tabela interativa com todas as respostas
- Indicadores visuais de satisfação

### 4. Analytics (BI)
- **Gráficos de Barras:**
  - Respostas por departamento
  - Satisfação média por departamento
  - Distribuição de avaliações
  - Avaliação média por categoria
- **Gráfico de Pizza:**
  - Taxa de recomendação
- **Gráfico de Linha:**
  - Tendência mensal de respostas
- **KPIs principais:**
  - Total de respostas
  - Satisfação média geral
  - Taxa de recomendação

## 🏗️ Arquitetura e Boas Práticas

### Componentes
- Componentes reutilizáveis e composáveis
- Uso de **class-variance-authority** para variantes
- Props tipadas com TypeScript
- Separação de responsabilidades

### Contextos
- AuthContext para gerenciamento de autenticação
- Provider pattern para compartilhamento de estado

### Services
- Camada de serviço isolada para lógica de negócio
- Simulação de API com localStorage
- Funções puras e testáveis

### Types
- Interfaces bem definidas
- Tipos compartilhados entre componentes
- Type safety em toda a aplicação

### Utils
- Funções utilitárias reutilizáveis
- Formatação de datas e números
- Helpers isolados

## 🎨 Design System

O projeto utiliza um design system customizado baseado em Tailwind CSS:

### Cores
- **Gray:** Tons neutros para texto e backgrounds
- **Blue:** Cor primária para ações
- **Green:** Sucesso e avaliações positivas
- **Pink/Purple:** Detalhes e acentos
- **Red:** Alertas e avaliações negativas
- **Yellow:** Avisos e neutros

### Componentes
- **Text:** Componente tipográfico com variantes (heading, body, caption)
- **Button:** Botões com variantes (primary, secondary, success, danger, outline)
- **Input:** Inputs com label e mensagens de erro
- **Select:** Selects estilizados
- **Textarea:** Área de texto
- **Card:** Containers com sombras e padding

## 🚦 Como Executar

1. **Instalar dependências:**
```bash
npm install
```

2. **Executar em modo de desenvolvimento:**
```bash
npm run dev
```

3. **Build para produção:**
```bash
npm run build
```

4. **Preview do build:**
```bash
npm run preview
```

## 📝 Rotas

- `/` - Página inicial com opções
- `/survey` - Formulário de pesquisa (público)
- `/login` - Página de login
- `/dashboard` - Dashboard administrativo (protegido)
- `/analytics` - Analytics e BI (protegido)

## 💾 Armazenamento de Dados

Atualmente o sistema utiliza **localStorage** para persistir dados. Para produção, recomenda-se:
- Migrar para uma API REST real
- Implementar banco de dados (PostgreSQL, MongoDB, etc)
- Adicionar autenticação JWT
- Implementar validações server-side

## 🔒 Segurança

Para ambiente de produção, implementar:
- Autenticação real com JWT
- Hash de senhas
- HTTPS obrigatório
- Rate limiting
- CORS configurado
- Validação e sanitização de inputs

## 📊 Próximas Melhorias

- [ ] Exportação de dados (CSV, PDF)
- [ ] Mais filtros e opções de busca
- [ ] Gráficos interativos avançados
- [ ] Notificações em tempo real
- [ ] Múltiplos idiomas (i18n)
- [ ] Temas claro/escuro
- [ ] Testes unitários e E2E
- [ ] CI/CD pipeline
- [ ] API backend real

## 📄 Licença

Este projeto foi desenvolvido seguindo as melhores práticas de arquitetura e clean code, inspirado nos cursos da Rocketseat.
