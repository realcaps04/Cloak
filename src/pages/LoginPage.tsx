import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakBrand } from '@/components/CloakLogo'
import { FeatureTag } from '@/components/FeatureTag'

function DiscordGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.04c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.08.08 0 0 0-.079-.04 19.7 19.7 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.027 14 14 0 0 0 1.226-1.994.08.08 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.08.08 0 0 1-.008-.127c.126-.094.252-.192.372-.291a.08.08 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.08.08 0 0 1 .079.01c.12.099.246.198.373.291a.08.08 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.08.08 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028 19.9 19.9 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

const highlights = [
  { title: 'Private', desc: 'Keep your IP hidden' },
  { title: 'Secure', desc: 'Join with confidence' },
  { title: 'Instant alerts', desc: 'Admins know right away' },
]

/** Player app login only — Cloak Desktop. */
export function LoginPage() {
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
    <main className="relative z-10 grid h-full min-h-0 overflow-y-auto lg:grid-cols-[1fr_1.05fr]">
      <section className="animate-rise flex flex-col justify-center px-8 py-10 lg:px-12">
        <div className="flex items-end gap-3">
          <CloakBrand />
          <BetaBadge size="md" className="mb-2" />
        </div>

        <h1 className="font-display text-glow mt-8 max-w-lg text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
          Join without <span className="text-signal">leaking IPs</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
          Cloak Desktop is for players. Join links stay inside the app. Access is limited to verified
          members of the Cloak Discord community.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <FeatureTag label="FiveM" />
          <FeatureTag label="Security" />
          <FeatureTag label="Desktop" />
          <FeatureTag label="Discord verified" />
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-line bg-panel/50 px-4 py-3 panel-glow"
            >
              <p className="text-sm font-semibold text-snow">{item.title}</p>
              <p className="mt-1 text-xs text-mist">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise-delay flex items-center justify-center px-6 py-10 lg:border-l lg:border-line/70 lg:bg-panel/20 lg:px-10">
        <div className="panel-glow w-full max-w-md rounded-2xl border border-line bg-panel/80 p-8">
          <h2 className="font-display text-center text-2xl font-bold text-snow">
            Sign in to Cloak Desktop
          </h2>
          <p className="mt-2 text-center text-sm text-mist">
            Join <span className="text-snow">{guildName}</span>, authorize once, and Cloak Desktop
            takes you home automatically.
          </p>

          <div className="mt-8 rounded-xl border border-signal/20 bg-signal/5 px-4 py-4">
            <p className="text-xs font-semibold tracking-wide text-signal uppercase">
              Step 1 — Join & verify
            </p>
            <p className="mt-1 text-xs leading-relaxed text-mist">
              Opens Discord (app or website) to {guildName}, then verifies membership in the
              background.
            </p>

            <button
              type="button"
              disabled={inProgress}
              onClick={() => void joinCommunityAndVerify()}
              className="no-drag mt-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-signal-bright/60 bg-signal px-5 py-3.5 text-sm font-bold text-void shadow-[0_0_24px_rgba(34,197,94,0.45)] transition hover:border-signal-bright hover:bg-signal-bright hover:shadow-[0_0_32px_rgba(52,211,153,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
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
                `Join ${guildName}`
              )}
            </button>

            {waitingMessage && (
              <p className="mt-3 text-[11px] leading-relaxed text-signal-dim">{waitingMessage}</p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-line bg-ink/50 px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-mist uppercase">
              Already in the server?
            </p>
            <button
              type="button"
              disabled={inProgress}
              onClick={() => void loginWithDiscord()}
              className="no-drag mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#7289da] bg-[#5865F2] px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(88,101,242,0.45)] transition hover:border-[#8ea1ff] hover:bg-[#4752c4] hover:shadow-[0_0_28px_rgba(88,101,242,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DiscordGlyph className="h-5 w-5" />
              {busy && !waitingForMembership ? 'Checking membership…' : 'Check Discord membership'}
            </button>
          </div>

          {inProgress && (
            <button
              type="button"
              onClick={() => void cancelAuth()}
              className="no-drag mt-3 w-full cursor-pointer text-center text-xs font-medium text-mist underline-offset-2 hover:text-snow hover:underline"
            >
              Cancel sign-in
            </button>
          )}

          {bridgeReady && !discordReady && configMissing.length > 0 && (
            <p className="mt-4 text-center text-xs leading-relaxed text-warn">
              {isPackagedApp ? (
                <>
                  This Cloak build is missing Discord config. Download the newest{' '}
                  <span className="font-semibold text-snow">Cloak.exe</span> from the website Products
                  page, replace this app, and open it again.
                </>
              ) : (
                <>
                  Missing in <code className="text-snow">.env</code>:{' '}
                  {configMissing.join(', ')}. Save the file, then fully restart Cloak (Ctrl+C →{' '}
                  <code className="text-snow">npm run dev</code>). Close any packaged Cloak.exe first.
                </>
              )}
            </p>
          )}

          {bridgeReady && discordReady && (
            <p className="mt-4 text-center text-xs leading-relaxed text-signal-dim">
              Discord is ready — click a button above to sign in.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-left text-sm text-warn">
              <p className="font-medium">
                {needsGuildJoin ? 'Membership not detected yet' : 'Sign-in failed'}
              </p>
              <p className="mt-1 text-xs leading-relaxed opacity-90">{error}</p>
              {needsGuildJoin && (
                <button
                  type="button"
                  disabled={inProgress}
                  onClick={() => void joinCommunityAndVerify()}
                  className="no-drag mt-3 cursor-pointer text-xs font-semibold text-signal underline-offset-2 hover:underline"
                >
                  Try Join {guildName} again →
                </button>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-[11px] leading-relaxed text-mist/70">
            Once Discord confirms you&apos;re in {guildName}, Cloak Desktop opens your servers.
          </p>
        </div>
      </section>
    </main>
  )
}
