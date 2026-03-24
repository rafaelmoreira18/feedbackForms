import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object') {
      // Unwrap NestJS envelope: { data, statusCode, timestamp } → data
      if ('data' in res.data && 'statusCode' in res.data) {
        res.data = res.data.data
      // Unwrap Next.js envelope: { data } → data  (sem statusCode)
      } else if ('data' in res.data && !('error' in res.data) && Object.keys(res.data).length <= 2) {
        res.data = res.data.data
      }
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
