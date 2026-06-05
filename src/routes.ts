export const ROUTES = {
  home: '/',
  login: '/login',
  changePassword: '/change-password',
  dashboard: '/dashboard',
  survey: (tenantSlug: string, formSlug: string) => `/${tenantSlug}/${formSlug}`,
  pesquisa: (tenantSlug: string) => `/${tenantSlug}/pesquisa`,
  analytics: (tenantSlug: string) => `/${tenantSlug}/analytics`,
  response: (tenantSlug: string, id: string) => `/${tenantSlug}/responses/${id}`,
  // RH Hub
  rhHubGlobal: '/rh-hub',
  rhHub: (tenantSlug: string) => `/${tenantSlug}/rh-hub`,
  // Training — public survey link only
  treinamento: (tenantSlug: string, sessionSlug: string) => `/${tenantSlug}/treinamento/${sessionSlug}`,
  // RH Users
  rhUsuarios: '/rh/usuarios',
  // Admin Users
  adminUsuarios: '/admin/usuarios',
  // Pesquisas Corporativas — public form only
  pesquisaCorporativaPublica: (tenantSlug: string, pesquisaSlug: string) => `/${tenantSlug}/pesquisa-corporativa/${pesquisaSlug}`,
  // Avaliação de Desempenho — public link (form do gestor → form do colaborador → relatório)
  avaliacaoDesempenho: (tenantSlug: string, slug: string) => `/${tenantSlug}/avaliacao-desempenho/${slug}`,
  // PDI — Plano de Desenvolvimento Individual — public link (gestor → colaborador → relatório)
  pdiDesenvolvimento: (tenantSlug: string, slug: string) => `/${tenantSlug}/pdi-desenvolvimento/${slug}`,
  // Protocolos (Protocolo de Dor Torácica) — aba do feedbackforms gateada por papel
  protocolos: (tenantSlug?: string) => (tenantSlug ? `/${tenantSlug}/protocolos` : '/protocolos'),
  protocoloForm: (tenantSlug: string, slug: string) => `/${tenantSlug}/protocolos/${slug}`,
  protocolosDashboard: (tenantSlug?: string) =>
    tenantSlug ? `/${tenantSlug}/protocolos-dashboard` : '/protocolos-dashboard',
  protocolosUsuarios: (tenantSlug?: string) =>
    tenantSlug ? `/${tenantSlug}/protocolos-usuarios` : '/protocolos-usuarios',
  protocolosConcluidos: (tenantSlug?: string) =>
    tenantSlug ? `/${tenantSlug}/protocolos-concluidos` : '/protocolos-concluidos',
} as const;
