export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  survey: (tenantSlug: string, formSlug: string) => `/${tenantSlug}/${formSlug}`,
  pesquisa: (tenantSlug: string) => `/${tenantSlug}/pesquisa`,
  analytics: (tenantSlug: string) => `/${tenantSlug}/analytics`,
  response: (tenantSlug: string, id: string) => `/${tenantSlug}/responses/${id}`,
  // Training
  treinamentosGlobal: '/treinamentos',
  treinamentos: (tenantSlug: string) => `/${tenantSlug}/treinamentos`,
  treinamento: (tenantSlug: string, sessionSlug: string) => `/${tenantSlug}/treinamento/${sessionSlug}`,
  // RH Users
  rhUsuarios: '/rh/usuarios',
} as const;
