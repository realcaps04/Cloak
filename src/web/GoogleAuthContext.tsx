import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { getConvexUrl, getGoogleClientId } from '@/lib/web'

export type GoogleWebUser = {
  id: string
  email: string
  name: string
  picture: string | null
}

type GoogleAuthValue = {
  user: GoogleWebUser | null
  loading: boolean
  busy: boolean
  error: string | null
  googleReady: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => void
}

const SESSION_KEY = 'cloak-web-session'
const OAUTH_MESSAGE = 'cloak-google-oauth'
const GoogleAuthContext = createContext<GoogleAuthValue | null>(null)

const signInWithGoogleFn = makeFunctionReference<
  'action',
  { idToken: string },
  { token: string; expiresAt: number; user: GoogleWebUser }
>('webAuth:signInWithGoogle')

const getGoogleSessionFn = makeFunctionReference<
  'query',
  { token: string },
  { token: string; expiresAt: number; user: GoogleWebUser } | null
>('webAuth:getGoogleSession')

const revokeGoogleSessionFn = makeFunctionReference<'mutation', { token: string }, { ok: boolean }>(
  'webAuth:revokeGoogleSession',
)

function client() {
  return new ConvexHttpClient(getConvexUrl())
}

function makeNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function setupHint() {
  const origin = window.location.origin
  const redirect = `${origin}/google-callback.html`
  return (
    `Add both of these in Google Cloud → Credentials → your Web OAuth client:\n` +
    `• Authorized JavaScript origins: ${origin}\n` +
    `• Authorized redirect URIs: ${redirect}`
  )
}

function openGoogleIdTokenPopup(clientId: string): Promise<string> {
  const redirectUri = `${window.location.origin}/google-callback.html`
  const nonce = makeNonce()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'id_token',
    response_mode: 'fragment',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    nonce,
    prompt: 'select_account',
  })

  const width = 520
  const height = 640
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))

  const popup = window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    'cloak-google-signin',
    `width=${width},height=${height},left=${left},top=${top},popup=yes`,
  )

  if (!popup) {
    return Promise.reject(new Error('Popup blocked. Allow popups for this site and try again.'))
  }

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearInterval(closedTimer)
      window.removeEventListener('message', onMessage)
      fn()
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        source?: string
        idToken?: string | null
        error?: string | null
      }
      if (data?.source !== OAUTH_MESSAGE) return

      if (data.idToken) {
        finish(() => resolve(data.idToken as string))
        return
      }

      finish(() =>
        reject(
          new Error(
            data.error === 'access_denied'
              ? 'Google sign-in was cancelled.'
              : `Google sign-in failed (${data.error || 'unknown'}). ${setupHint()}`,
          ),
        ),
      )
    }

    window.addEventListener('message', onMessage)

    const closedTimer = window.setInterval(() => {
      if (!popup.closed) return
      finish(() => reject(new Error('Google sign-in was cancelled.')))
    }, 400)
  })
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleWebUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const googleReady = Boolean(getGoogleClientId())

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const token = localStorage.getItem(SESSION_KEY)
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const session = await client().query(getGoogleSessionFn, { token })
        if (!cancelled && session) setUser(session.user)
        else if (!cancelled) localStorage.removeItem(SESSION_KEY)
      } catch {
        if (!cancelled) localStorage.removeItem(SESSION_KEY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const clientId = getGoogleClientId()
    if (!clientId) {
      setError('Add VITE_GOOGLE_CLIENT_ID to .env, then restart the website.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const idToken = await openGoogleIdTokenPopup(clientId)
      const result = await client().action(signInWithGoogleFn, { idToken })
      localStorage.setItem(SESSION_KEY, result.token)
      setUser(result.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      if (message.includes('origin') || message.includes('redirect') || message.includes('400')) {
        setError(`${message} ${setupHint()}`)
      } else {
        setError(message)
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const logout = useCallback(() => {
    const token = localStorage.getItem(SESSION_KEY)
    if (token) {
      void client().mutation(revokeGoogleSessionFn, { token }).catch(() => undefined)
    }
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, busy, error, googleReady, signInWithGoogle, logout }),
    [user, loading, busy, error, googleReady, signInWithGoogle, logout],
  )

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext)
  if (!ctx) throw new Error('useGoogleAuth must be used inside GoogleAuthProvider')
  return ctx
}
