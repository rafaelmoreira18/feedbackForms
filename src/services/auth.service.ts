import type { User } from '@/types'
import { api } from './api'

interface LoginResponse {
  accessToken: string
  user: User
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('auth/login', { email, password })
    return res.data
  },
}
