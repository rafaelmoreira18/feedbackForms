export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  survey: (tenantSlug: string, formSlug: string) => `/${tenantSlug}/${formSlug}`,
  pesquisa: (tenantSlug: string) => `/${tenantSlug}/pesquisa`,
  analytics: (tenantSlug: string) => `/${tenantSlug}/analytics`,
  response: (tenantSlug: string, id: string) => `/${tenantSlug}/responses/${id}`,
} as const;
