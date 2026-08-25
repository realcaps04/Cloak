import { useAuth } from '@/context/AuthContext'

function DiscordGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.04c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.08.08 0 0 0-.079-.04 19.7 19.7 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.027 14 14 0 0 0 1.226-1.994.08.08 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.08.08 0 0 1-.008-.127c.126-.094.252-.192.372-.291a.08.08 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.08.08 0 0 1 .079.01c.12.099.246.198.373.291a.08.08 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.08.08 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028 19.9 19.9 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

export function LoginPage() {
  const { loginWithDiscord, previewAsGuest, busy, error, discordReady } = useAuth()

  return (
    <main className="relative z-10 flex min-h-[calc(100vh-2.25rem)] flex-col items-center justify-center px-6 pb-16">
      <div className="animate-rise mx-auto w-full max-w-lg text-center">
        <p className="mb-5 text-xs font-semibold tracking-[0.35em] text-signal uppercase">
          Upcoming 2026
        </p>
        <h1 className="font-display text-glow text-[4.5rem] leading-none font-extrabold tracking-tight sm:text-[5.5rem]">
          Cloak
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-mist">
          Join without leaking IPs. FiveM links stay inside the app — if someone tries to share
          them out, admins get alerted.
        </p>
      </div>

      <div className="animate-rise-delay mt-12 w-full max-w-sm space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void loginWithDiscord()}
          className="no-drag group flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-wait disabled:opacity-70"
        >
          <DiscordGlyph className="h-5 w-5" />
          {busy ? 'Waiting for Discord…' : 'Continue with Discord'}
        </button>

        {!discordReady && (
          <p className="text-center text-xs leading-relaxed text-mist/80">
            Discord keys are not in `.env` yet — use preview mode to explore the UI, then plug in
            your Discord app when ready.
          </p>
        )}

        <button
          type="button"
          onClick={previewAsGuest}
          className="no-drag w-full rounded-xl border border-line bg-panel/60 px-5 py-3 text-sm font-medium text-snow/90 transition hover:border-signal/30 hover:bg-panel"
        >
          Preview the app
        </button>

        {error && (
          <div className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-left text-sm text-warn">
            {error}
          </div>
        )}
      </div>

      <div className="animate-rise-delay mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] tracking-[0.18em] text-mist/70 uppercase">
        <span>FiveM</span>
        <span className="h-1 w-1 rounded-full bg-mist/40" />
        <span>Security</span>
        <span className="h-1 w-1 rounded-full bg-mist/40" />
        <span>Desktop</span>
      </div>
    </main>
  )
}
