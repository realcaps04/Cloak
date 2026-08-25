import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon, CLOAK_BRAND_SRC } from '@/components/CloakLogo'

function DiscordGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.04c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.08.08 0 0 0-.079-.04 19.7 19.7 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.027 14 14 0 0 0 1.226-1.994.08.08 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.08.08 0 0 1-.008-.127c.126-.094.252-.192.372-.291a.08.08 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.08.08 0 0 1 .079.01c.12.099.246.198.373.291a.08.08 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.08.08 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028 19.9 19.9 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

const staffPoints = [
  'Grant server access by Discord account',
  'Keep FiveM endpoints off public channels',
  'Issue warnings and penalties to players',
]

/** Staff-only login — visually separate from Cloak Desktop player login. */
export function AdminLoginPage() {
  const {
    loginWithDiscord,
    joinCommunityAndVerify,
    cancelAuth,
    busy,
    waitingForMembership,
    waitingMessage,
    error,
    errorCode,
    discordReady,
    bridgeReady,
    configMissing,
    community,
  } = useAuth()

  const [isPackagedApp, setIsPackagedApp] = useState(false)

  useEffect(() => {
    void window.cloak?.getUpdateRuntimeInfo?.().then((info) => {
      setIsPackagedApp(Boolean(info.packaged))
    })
  }, [])

  const guildName = community?.guildName ?? 'Cloak Community'
  const needsGuildJoin = errorCode === 'NOT_IN_GUILD'
  const inProgress = busy || waitingForMembership

  return (
    <main className="relative z-10 flex h-full min-h-0 items-center justify-center overflow-y-auto px-6 py-10">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-warn/35 bg-warn/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-warn uppercase">
            Staff console
            <BetaBadge />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="relative">
              <CloakIcon size="lg" />
              <span className="absolute -right-1 -bottom-1 rounded bg-warn px-1.5 py-0.5 text-[9px] font-bold text-void">
                ADM
              </span>
            </div>
            <img
              src={CLOAK_BRAND_SRC}
              alt="Cloak Admin"
              className="h-16 w-auto max-w-[min(100%,14rem)] object-contain object-left opacity-95"
            />
          </div>

          <h1 className="font-display mt-8 max-w-xl text-4xl leading-[1.08] font-extrabold tracking-tight text-snow sm:text-5xl">
            Connect Players <span className="text-warn">at your Desire</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-mist">
            Cloak Admin is for server owners and staff only. Decide who joins, keep IPs private, and
            run moderation from this desktop console — not the player app.
          </p>

          <ul className="mt-8 space-y-3">
            {staffPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-snow">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-warn" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="animate-rise-delay">
          <div className="rounded-3xl border border-warn/25 bg-panel/90 p-8 shadow-[0_0_60px_rgba(240,180,90,0.12)]">
            <p className="text-center text-xs font-semibold tracking-[0.18em] text-warn uppercase">
              Cloak Admin
            </p>
            <h2 className="font-display mt-2 text-center text-2xl font-bold text-snow">
              Staff Discord sign-in
            </h2>
            <p className="mt-2 text-center text-sm text-mist">
              Same {guildName} membership as players — this app opens the admin control panel.
            </p>

            <button
              type="button"
              disabled={inProgress}
              onClick={() => void joinCommunityAndVerify()}
              className="no-drag mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-warn/50 bg-warn px-5 py-3.5 text-sm font-bold text-void transition hover:bg-[#f5c46e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {waitingForMembership ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/20 border-t-void" />
                  Waiting for membership…
                </>
              ) : busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/20 border-t-void" />
                  Opening Discord…
                </>
              ) : (
                `Join ${guildName} as staff`
              )}
            </button>

            {waitingMessage ? (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-warn/90">{waitingMessage}</p>
            ) : null}

            <button
              type="button"
              disabled={inProgress}
              onClick={() => void loginWithDiscord()}
              className="no-drag mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#7289da] bg-[#5865F2] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DiscordGlyph className="h-5 w-5" />
              {busy && !waitingForMembership ? 'Checking membership…' : 'Already in Discord — continue'}
            </button>

            {inProgress ? (
              <button
                type="button"
                onClick={() => void cancelAuth()}
                className="no-drag mt-3 w-full cursor-pointer text-center text-xs font-medium text-mist underline-offset-2 hover:text-snow hover:underline"
              >
                Cancel sign-in
              </button>
            ) : null}

            {bridgeReady && !discordReady && configMissing.length > 0 ? (
              <p className="mt-4 text-center text-xs leading-relaxed text-warn">
                {isPackagedApp ? (
                  <>This Admin build is missing Discord config. Rebuild with a valid project .env.</>
                ) : (
                  <>
                    Missing in <code className="text-snow">.env</code>: {configMissing.join(', ')}.
                    Restart with <code className="text-snow">npm run dev:admin</code>.
                  </>
                )}
              </p>
            ) : null}

            {bridgeReady && discordReady ? (
              <p className="mt-4 text-center text-xs text-mist">Discord is ready for Cloak Admin.</p>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-left text-sm text-warn">
                <p className="font-medium">
                  {needsGuildJoin ? 'Membership not detected yet' : 'Sign-in failed'}
                </p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{error}</p>
              </div>
            ) : null}

            <p className="mt-6 text-center text-[11px] leading-relaxed text-mist/70">
              Cloak Desktop (players) can stay open — Admin runs as a separate app.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
