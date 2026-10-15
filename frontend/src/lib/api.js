import axios from 'axios'

export const TOKEN_KEY = 'localkart_token'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const errorMessage = (err) => err?.response?.data?.message || err?.message || 'Something went wrong'

export default api
