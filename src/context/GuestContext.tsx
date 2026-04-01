import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useGuest } from '../hooks/useGuest'
import type { Guest } from '../types'

interface GuestContextValue {
  /** The currently logged-in guest, or null if no one has entered their name yet. */
  guest: Guest | null
  /** True while the findOrCreate call is in flight. */
  loading: boolean
  /** Any error from the last login attempt. */
  error: Error | null
  /** Look up or register a guest by name and store them in context. */
  login: (name: string) => Promise<void>
  /** Clear the current guest (e.g. "change name" flow). */
  logout: () => void
}

const GuestContext = createContext<GuestContextValue | null>(null)

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<Guest | null>(() => {
    // Rehydrate from sessionStorage so a page refresh doesn't log the user out
    try {
      const stored = sessionStorage.getItem('wedding_guest')
      return stored ? (JSON.parse(stored) as Guest) : null
    } catch {
      return null
    }
  })

  const { findOrCreateGuest, loading, error } = useGuest()

  const login = useCallback(
    async (name: string) => {
      const found = await findOrCreateGuest(name)
      setGuest(found)
      sessionStorage.setItem('wedding_guest', JSON.stringify(found))
    },
    [findOrCreateGuest],
  )

  const logout = useCallback(() => {
    setGuest(null)
    sessionStorage.removeItem('wedding_guest')
  }, [])

  return (
    <GuestContext.Provider value={{ guest, loading, error, login, logout }}>
      {children}
    </GuestContext.Provider>
  )
}

/** Access the current guest session from any component. */
export function useGuestContext(): GuestContextValue {
  const ctx = useContext(GuestContext)
  if (!ctx) throw new Error('useGuestContext must be used inside <GuestProvider>')
  return ctx
}
