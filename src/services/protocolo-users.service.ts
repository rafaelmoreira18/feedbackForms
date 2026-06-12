import type { ProtocoloUser } from '@/types'
import { api } from './api'

export interface CreateProtocoloUserPayload {
  nome: string
  username: string
  senha: string
  role:
    | 'protocolo_operador'
    | 'protocolo_medico'
    | 'protocolo_admin'
    | 'protocolo_admin_global'
  /** CRM (médico) ou COREN (operador). Obrigatório para operador/médico. */
  registroProfissional?: string
  tenantId?: string
}

export const protocoloUsersService = {
  getTenants: async (): Promise<{ id: string; slug: string; nome: string }[]> => {
    const res = await api.get<{ id: string; slug: string; nome: string }[]>('protocolos/usuarios/tenants')
    return res.data
  },

  getAll: async (): Promise<ProtocoloUser[]> => {
    const res = await api.get<ProtocoloUser[]>('protocolos/usuarios')
    return res.data
  },

  create: async (payload: CreateProtocoloUserPayload): Promise<ProtocoloUser> => {
    const res = await api.post<ProtocoloUser>('protocolos/usuarios', payload)
    return res.data
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.post(`protocolos/usuarios/${id}/reset-password`, { newPassword })
  },

  setActive: async (id: string, ativo: boolean): Promise<void> => {
    await api.patch(`protocolos/usuarios/${id}/ativo`, { ativo })
  },
}
