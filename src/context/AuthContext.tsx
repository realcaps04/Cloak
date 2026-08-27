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
  bridgeReady: boolean
  configMissing: string[]
  community: DiscordCommunity | null
  loginWithDiscord: () => Promise<void>
  joinCommunityAndVerify: () => Promise<void>
  enterStoreReview: () => Promise<void>
  openDiscordInvite: () => Promise<void>
  cancelAuth: () => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function waitForCloak(maxMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (window.cloak) return window.cloak
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return undefined
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms)
      }),
    ])
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloakUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [waitingForMembership, setWaitingForMembership] = useState(false)
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null)
  const [discordReady, setDiscordReady] = useState(false)
  const [bridgeReady, setBridgeReady] = useState(false)
  const [configMissing, setConfigMissing] = useState<string[]>([])
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

  const refreshDiscordStatus = useCallback(async () => {
    const cloak = window.cloak ?? (await waitForCloak(2000))
    if (!cloak) {
      setBridgeReady(false)
      setDiscordReady(false)
      setConfigMissing(['DESKTOP_BRIDGE'])
      return
    }

    setBridgeReady(true)
    const [status, info] = await Promise.all([
      cloak.getDiscordConfigStatus?.() ?? cloak.isDiscordConfigured().then((configured) => ({
        configured,
        missing: configured ? [] : ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_GUILD_ID'],
      })),
      cloak.getDiscordCommunity(),
    ])
    setDiscordReady(status.configured)
    setConfigMissing(status.missing)
    setCommunity(info)
  }, [])

  useEffect(() => {
    let cancelled = false
    let unsubscribeAuth: (() => void) | undefined
    let unsubscribeWaiting: (() => void) | undefined

    async function boot() {
      const cloak = await waitForCloak()
      if (cancelled) return

      if (cloak) {
        setBridgeReady(true)

        unsubscribeAuth = cloak.onAuthResult((result) => {
          setBusy(false)
          if (result.ok) {
            applyAuthSuccess(result.user)
          } else {
            applyAuthFailure(result)
          }
        })

        unsubscribeWaiting = cloak.onMembershipWaiting((payload) => {
          setWaitingForMembership(true)
          setWaitingMessage(payload.message)
          setError(null)
          setErrorCode(null)
        })

        const [status, info] = await Promise.all([
          cloak.getDiscordConfigStatus?.() ?? cloak.isDiscordConfigured().then((configured) => ({
            configured,
            missing: configured ? [] : ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_GUILD_ID'],
          })),
          cloak.getDiscordCommunity(),
        ])
        if (!cancelled) {
          setDiscordReady(status.configured)
          setConfigMissing(status.missing)
          setCommunity(info)
        }
      } else if (!cancelled) {
        setBridgeReady(false)
        setDiscordReady(false)
        setConfigMissing(['DESKTOP_BRIDGE'])
      }

      try {
        const restored = cloak
          ? await withTimeout(cloak.restoreSession(), 12_000)
          : null
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
      setWaitingForMembership(false)
      setWaitingMessage(null)

      const safetyTimer = window.setTimeout(() => {
        void window.cloak?.cancelDiscordAuth?.()
        setBusy(false)
        setWaitingForMembership(false)
        setWaitingMessage(null)
        setError(
          'Discord sign-in timed out. Complete authorization in the browser, or try Cancel and sign in again.',
        )
        setErrorCode('UNKNOWN')
      }, 100_000)

      try {
        const cloak = window.cloak ?? (await waitForCloak(2000))
        if (!cloak) {
          setError(
            'Cloak is open in a browser tab. Close that tab and use the Cloak Beta desktop window instead.',
          )
          setErrorCode('UNKNOWN')
          setBridgeReady(false)
          setConfigMissing(['DESKTOP_BRIDGE'])
          return
        }

        setBridgeReady(true)
        await refreshDiscordStatus()

        const result =
          mode === 'join' ? await cloak.joinAndVerify() : await cloak.discordLogin()

        if (result.ok) {
          applyAuthSuccess(result.user)
        } else if (result.code !== 'CANCELLED') {
          applyAuthFailure(result)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Discord login failed')
        setErrorCode('UNKNOWN')
        setWaitingForMembership(false)
        setWaitingMessage(null)
      } finally {
        window.clearTimeout(safetyTimer)
        setBusy(false)
      }
    },
    [applyAuthFailure, applyAuthSuccess, refreshDiscordStatus],
  )

  const loginWithDiscord = useCallback(async () => {
    await runAuth('login')
  }, [runAuth])

  const joinCommunityAndVerify = useCallback(async () => {
    await runAuth('join')
  }, [runAuth])

  const enterStoreReview = useCallback(async () => {
    setError(null)
    setErrorCode(null)
    setBusy(true)
    try {
      const result = await window.cloak?.enterStoreReview?.()
      if (!result?.ok) {
        setError(result?.error ?? 'Store review preview is unavailable.')
        setErrorCode('UNKNOWN')
        return
      }
      applyAuthSuccess(result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open review preview.')
      setErrorCode('UNKNOWN')
    } finally {
      setBusy(false)
    }
  }, [applyAuthSuccess])

  const openDiscordInvite = useCallback(async () => {
    await window.cloak?.openDiscordInvite()
  }, [])

  const cancelAuth = useCallback(async () => {
    await window.cloak?.cancelDiscordAuth?.()
    setBusy(false)
    setWaitingForMembership(false)
    setWaitingMessage(null)
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
      bridgeReady,
      configMissing,
      community,
      loginWithDiscord,
      joinCommunityAndVerify,
      enterStoreReview,
      openDiscordInvite,
      cancelAuth,
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
      bridgeReady,
      configMissing,
      community,
      loginWithDiscord,
      joinCommunityAndVerify,
      enterStoreReview,
      openDiscordInvite,
      cancelAuth,
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
