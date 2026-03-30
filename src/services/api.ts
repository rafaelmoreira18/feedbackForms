import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send HttpOnly auth_token cookie on every request
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
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
