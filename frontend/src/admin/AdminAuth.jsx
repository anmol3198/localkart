import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import adminApi, { ADMIN_TOKEN_KEY } from './adminApi.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [ready, setReady] = useState(() => !localStorage.getItem(ADMIN_TOKEN_KEY))

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdmin(null)
  }, [])

  const login = useCallback((token, who) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
    setAdmin(who)
  }, [])

  // Restore the session; an expired or revoked token just means "log in again".
  useEffect(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) return
    adminApi.get('/me').then(({ data }) => setAdmin(data)).catch(() => logout()).finally(() => setReady(true))
  }, [logout])

  // Any 401 later (session expired, account deactivated) signs out.
  useEffect(() => {
    const id = adminApi.interceptors.response.use((r) => r, (err) => {
      if (err.response?.status === 401) logout()
      return Promise.reject(err)
    })
    return () => adminApi.interceptors.response.eject(id)
  }, [logout])

  return <AdminAuthContext.Provider value={{ admin, ready, login, logout, isSuper: admin?.role === 'SUPER_ADMIN' }}>{children}</AdminAuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => useContext(AdminAuthContext)
