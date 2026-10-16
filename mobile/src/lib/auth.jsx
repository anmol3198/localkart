import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { secure } from './storage.js'
import { setApiToken } from './api.js'

const KEY = 'localkart_token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    secure.get(KEY).then((t) => {
      setApiToken(t)
      setToken(t)
    }).finally(() => setReady(true))
  }, [])

  const login = useCallback(async (t) => {
    setApiToken(t)
    setToken(t)
    await secure.set(KEY, t)
  }, [])

  const logout = useCallback(async () => {
    setApiToken(null)
    setToken(null)
    await secure.remove(KEY)
  }, [])

  // Wait for the saved token before showing any screen, so owner screens never load logged-out by mistake.
  if (!ready) return null
  return <AuthContext.Provider value={{ token, ready, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
