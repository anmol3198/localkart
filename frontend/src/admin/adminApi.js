import axios from 'axios'

// Staff sessions are kept apart from shop-owner sessions (different storage key, different token role).
export const ADMIN_TOKEN_KEY = 'localkart_admin_token'

const adminApi = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || '/api'}/admin` })

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default adminApi
