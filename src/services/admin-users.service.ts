import { api } from './api'
import { tenantService } from './tenant-service'

export interface AdminUser {
  id: string
  email: string
  username: string | null
  nome: string
  role: string
  tenantId: string | null
  tenantSlug: string | null
  tenantNome: string | null
  ativo: boolean
  mustChangePassword: boolean
  criadoEm: string
}

export interface CreateAdminUserInput {
  nome: string
  username: string
  senha: string
  role: 'operator_forms' | 'tenant_admin' | 'super_admin'
  tenantId?: string
}

export const adminUsersService = {
  listByTenant: async (tenantId: string): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>('admin/usuarios', { params: { tenantId } })
    return res.data
  },

  create: async (input: CreateAdminUserInput): Promise<AdminUser> => {
    const payload: Record<string, unknown> = {
      nome: input.nome,
      username: input.username,
      senha: input.senha,
      role: input.role,
    }
    if (input.tenantId) payload.tenantId = input.tenantId
    const res = await api.post<AdminUser>('admin/usuarios', payload)
    return res.data
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    await api.post(`admin/usuarios/${userId}/reset-password`, { newPassword })
  },

  toggleAtivo: async (userId: string, ativo: boolean): Promise<void> => {
    await api.patch(`admin/usuarios/${userId}/ativo`, { ativo })
  },

  listTenants: tenantService.getAll,
}
