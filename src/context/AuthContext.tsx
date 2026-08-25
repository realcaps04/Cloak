import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearSession, loadSession, saveSession } from '@/lib/session'
import type { CloakUser } from '@/lib/types'

type AuthContextValue = {
  user: CloakUser | null
  loading: boolean
  busy: boolean
  error: string | null
  discordReady: boolean
  loginWithDiscord: () => Promise<void>
  previewAsGuest: () => void
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloakUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discordReady, setDiscordReady] = useState(false)

  useEffect(() => {
    setUser(loadSession())
    setLoading(false)

    void window.cloak?.isDiscordConfigured().then(setDiscordReady)

    const unsubscribe = window.cloak?.onAuthResult((result) => {
      setBusy(false)
      if (result.ok) {
        saveSession(result.user)
        setUser(result.user)
        setError(null)
      } else {
        setError(result.error)
      }
    })

    return () => unsubscribe?.()
  }, [])

  const loginWithDiscord = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      if (!window.cloak) {
        setError('Cloak desktop bridge is not available. Run the app with npm run dev.')
        setBusy(false)
        return
      }

      const result = await window.cloak.discordLogin()
      if (result.ok) {
        saveSession(result.user)
        setUser(result.user)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discord login failed')
    } finally {
      setBusy(false)
    }
  }, [])

  const previewAsGuest = useCallback(() => {
    const demo: CloakUser = {
      id: 'preview',
      username: 'operator',
      globalName: 'Preview Operator',
      avatar: null,
      discriminator: '0',
    }
    saveSession(demo)
    setUser(demo)
    setError(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      busy,
      error,
      discordReady,
      loginWithDiscord,
      previewAsGuest,
      logout,
      clearError: () => setError(null),
    }),
    [user, loading, busy, error, discordReady, loginWithDiscord, previewAsGuest, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
