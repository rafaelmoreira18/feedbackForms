import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 30_000, // 30s — evita requests pendurados indefinidamente
})

api.interceptors.response.use(
  (res) => {
    // Unwrap NestJS envelope: { data, statusCode, timestamp } → data
    if (
      res.data &&
      typeof res.data === 'object' &&
      'data' in res.data &&
      'statusCode' in res.data &&
      'timestamp' in res.data
    ) {
      res.data = res.data.data
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
