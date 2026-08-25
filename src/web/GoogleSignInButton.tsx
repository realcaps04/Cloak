import { getGoogleClientId } from '@/lib/web'
import { useGoogleAuth } from '@/web/GoogleAuthContext'
import { GoogleMark } from '@/web/WebsiteIcons'

export function GoogleSignInButton({
  className = '',
  label = 'Sign in with Google',
  compact = false,
  variant = 'snow',
}: {
  className?: string
  label?: string
  compact?: boolean
  variant?: 'snow' | 'signal'
}) {
  const { signInWithGoogle, busy, error } = useGoogleAuth()
  const configured = Boolean(getGoogleClientId())
  const buttonClass =
    variant === 'signal'
      ? 'inline-flex items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-bold text-void transition hover:bg-signal-bright disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-snow px-4 py-2.5 text-sm font-bold text-void transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy || !configured}
        onClick={() => void signInWithGoogle()}
        className={buttonClass}
      >
        <GoogleMark className="h-4 w-4 shrink-0" />
        {busy ? 'Opening Google…' : label}
      </button>
      {!configured && !compact && (
        <p className="mt-2 text-xs leading-relaxed text-warn">
          Add <code className="text-snow">VITE_GOOGLE_CLIENT_ID</code> to{' '}
          <code className="text-snow">.env</code>, then restart this website.
        </p>
      )}
      {error && (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-warn">{error}</p>
      )}
    </div>
  )
}
