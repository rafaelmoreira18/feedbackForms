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
} as const;
