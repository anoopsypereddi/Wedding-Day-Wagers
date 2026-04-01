import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'wedding_admin_token'
const TOKEN_VALUE = 'admin_authenticated'

interface AdminContextValue {
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })

  const login = useCallback((password: string): boolean => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    if (password === adminPassword) {
      localStorage.setItem(STORAGE_KEY, TOKEN_VALUE)
      setToken(TOKEN_VALUE)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  return (
    <AdminContext.Provider value={{ isAdmin: token === TOKEN_VALUE, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdminContext must be used inside <AdminProvider>')
  return ctx
}
