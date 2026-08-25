import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearSession, saveSession } from '@/lib/session'
import type { AuthErrorCode, CloakUser, DiscordCommunity } from '@/lib/types'

type AuthContextValue = {
  user: CloakUser | null
  loading: boolean
  busy: boolean
  waitingForMembership: boolean
  waitingMessage: string | null
  error: string | null
  errorCode: AuthErrorCode | null
  discordReady: boolean
  community: DiscordCommunity | null
  loginWithDiscord: () => Promise<void>
  joinCommunityAndVerify: () => Promise<void>
  openDiscordInvite: () => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloakUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [waitingForMembership, setWaitingForMembership] = useState(false)
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null)
  const [discordReady, setDiscordReady] = useState(false)
  const [community, setCommunity] = useState<DiscordCommunity | null>(null)

  const applyAuthFailure = useCallback((result: { error: string; code?: AuthErrorCode }) => {
    setWaitingForMembership(false)
    setWaitingMessage(null)
    setError(result.error)
    setErrorCode(result.code ?? 'UNKNOWN')
  }, [])

  const applyAuthSuccess = useCallback((nextUser: CloakUser) => {
    saveSession(nextUser)
    setUser(nextUser)
    setWaitingForMembership(false)
    setWaitingMessage(null)
    setError(null)
    setErrorCode(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      void window.cloak?.isDiscordConfigured().then(setDiscordReady)
      void window.cloak?.getDiscordCommunity().then(setCommunity)

      try {
        const restored = await window.cloak?.restoreSession()
        if (!cancelled && restored?.ok) {
          applyAuthSuccess(restored.user)
        } else if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()

    const unsubscribeAuth = window.cloak?.onAuthResult((result) => {
      setBusy(false)
      if (result.ok) {
        applyAuthSuccess(result.user)
      } else {
        applyAuthFailure(result)
      }
    })

    const unsubscribeWaiting = window.cloak?.onMembershipWaiting((payload) => {
      setWaitingForMembership(true)
      setWaitingMessage(payload.message)
      setError(null)
      setErrorCode(null)
    })

    return () => {
      cancelled = true
      unsubscribeAuth?.()
      unsubscribeWaiting?.()
    }
  }, [applyAuthFailure, applyAuthSuccess])

  const runAuth = useCallback(
    async (mode: 'login' | 'join') => {
      setError(null)
      setErrorCode(null)
      setBusy(true)
      setWaitingForMembership(mode === 'join')
      setWaitingMessage(
        mode === 'join'
          ? 'Opening Discord… authorize Cloak, then we verify membership automatically.'
          : null,
      )

      try {
        if (!window.cloak) {
          setError('Cloak desktop bridge is not available. Run the app with npm run dev.')
          setErrorCode('UNKNOWN')
          setBusy(false)
          setWaitingForMembership(false)
          setWaitingMessage(null)
          return
        }

        const result =
          mode === 'join' ? await window.cloak.joinAndVerify() : await window.cloak.discordLogin()

        if (result.ok) {
          applyAuthSuccess(result.user)
        } else {
          applyAuthFailure(result)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Discord login failed')
        setErrorCode('UNKNOWN')
        setWaitingForMembership(false)
        setWaitingMessage(null)
      } finally {
        setBusy(false)
      }
    },
    [applyAuthFailure, applyAuthSuccess],
  )

  const loginWithDiscord = useCallback(async () => {
    await runAuth('login')
  }, [runAuth])

  const joinCommunityAndVerify = useCallback(async () => {
    await runAuth('join')
  }, [runAuth])

  const openDiscordInvite = useCallback(async () => {
    await window.cloak?.openDiscordInvite()
  }, [])

  const logout = useCallback(() => {
    void window.cloak?.logout()
    clearSession()
    setUser(null)
    setWaitingForMembership(false)
    setWaitingMessage(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      busy,
      waitingForMembership,
      waitingMessage,
      error,
      errorCode,
      discordReady,
      community,
      loginWithDiscord,
      joinCommunityAndVerify,
      openDiscordInvite,
      logout,
      clearError: () => {
        setError(null)
        setErrorCode(null)
      },
    }),
    [
      user,
      loading,
      busy,
      waitingForMembership,
      waitingMessage,
      error,
      errorCode,
      discordReady,
      community,
      loginWithDiscord,
      joinCommunityAndVerify,
      openDiscordInvite,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
