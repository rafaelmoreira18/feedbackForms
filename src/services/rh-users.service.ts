import { api } from './api'

export interface RhUser {
  id: string
  email: string
  nome: string
  role: string
  tenantId: string | null
  ativo: boolean
  tenantSlug: string | null
  tenantNome: string | null
}

export interface CreateRhUserInput {
  nome: string
  username: string
  senha: string
  tenantId: string
}

export interface RhTenant {
  id: string
  slug: string
  nome: string
}

export const rhUsersService = {
  list: async (): Promise<RhUser[]> => {
    const res = await api.get<RhUser[]>('rh/usuarios')
    return res.data
  },

  create: async (input: CreateRhUserInput): Promise<RhUser> => {
    const res = await api.post<RhUser>('rh/usuarios', input)
    return res.data
  },

  listTenants: async (): Promise<RhTenant[]> => {
    const res = await api.get<RhTenant[]>('rh/usuarios/tenants')
    return res.data
  },
}
