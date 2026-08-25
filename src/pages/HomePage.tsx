import { useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon } from '@/components/CloakLogo'
import { ServerCard } from '@/components/ServerCard'
import { BETA_SERVERS } from '@/lib/servers'
import { avatarUrl, displayName } from '@/lib/types'

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

export function HomePage() {
  const { user, logout, community } = useAuth()
  if (!user) return null

  const name = displayName(user)
  const onlineCount = BETA_SERVERS.filter((s) => s.status === 'online').length

  const handleJoin = useCallback(async (serverId: string) => {
    if (window.cloak?.joinServer) {
      return window.cloak.joinServer(serverId)
    }
    return {
      ok: false,
      message: 'Run Cloak as a desktop app to connect to servers.',
    }
  }, [])

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-2.25rem)]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line/80 bg-panel/30 px-5 py-6 lg:flex">
        <div className="flex items-center gap-2.5">
          <CloakIcon size="md" />
          <span className="font-display text-base font-bold tracking-tight text-snow">Cloak</span>
        </div>
        <BetaBadge className="mt-3 w-fit" />

        <nav className="mt-10 space-y-1 text-sm">
          <div className="rounded-lg bg-signal/10 px-3 py-2 font-medium text-signal">Servers</div>
          <div className="rounded-lg px-3 py-2 text-mist">Clipboard shield</div>
          <div className="rounded-lg px-3 py-2 text-mist/70">Activity</div>
        </nav>

        <div className="mt-auto rounded-xl border border-line bg-ink/70 p-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl(user)}
              alt=""
              className="h-9 w-9 rounded-full border border-line object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-snow">{name}</p>
              <p className="truncate text-xs text-mist">
                {user.guildVerified
                  ? `Verified · ${user.guildName ?? community?.guildName ?? 'Cloak'}`
                  : `Discord · ${community?.guildName ?? 'Cloak'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="no-drag mt-4 w-full rounded-lg border border-line px-3 py-2 text-xs font-medium text-mist transition hover:border-snow/20 hover:text-snow"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6 lg:px-8">
        <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-signal uppercase">
              Protected servers
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-snow">
              Welcome back, {name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-mist">
              Pick a server and join through Cloak — the real IP never shows up in your clipboard or
              chat.
            </p>
          </div>

          <div className="no-drag flex items-center gap-3 lg:hidden">
            <img
              src={avatarUrl(user)}
              alt=""
              className="h-10 w-10 rounded-full border border-line object-cover"
            />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-mist"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="animate-rise-delay mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel/60 px-4 py-3">
            <p className="text-xs tracking-wide text-mist uppercase">Online now</p>
            <p className="font-display mt-1 text-2xl font-bold text-signal">{onlineCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel/60 px-4 py-3">
            <p className="text-xs tracking-wide text-mist uppercase">IP protection</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-snow">
              <ShieldIcon className="h-4 w-4 text-signal" />
              Active
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel/60 px-4 py-3">
            <p className="text-xs tracking-wide text-mist uppercase">Leak alerts</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-snow">
              <BellIcon className="h-4 w-4 text-signal" />
              Monitoring
            </p>
          </div>
        </div>

        <section className="animate-rise-delay mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-snow">Your servers</h2>
              <p className="mt-1 text-sm text-mist">
                Beta servers — connect launches FiveM without exposing join links.
              </p>
            </div>
            <BetaBadge size="md" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {BETA_SERVERS.map((server) => (
              <ServerCard key={server.id} server={server} onJoin={handleJoin} />
            ))}
          </div>
        </section>

        <section className="animate-rise-delay mt-8 grid gap-4 pb-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-panel/50 p-5">
            <p className="text-xs tracking-[0.22em] text-mist uppercase">Clipboard shield</p>
            <h3 className="font-display mt-2 text-lg font-semibold">Leak prevention</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              If a join link gets copied or pasted outside Cloak, the admin app gets pinged
              immediately.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-signal-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
              Beta — full monitoring ships with Cloak Admin
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-ink/70 p-5">
            <p className="text-xs tracking-[0.22em] text-mist uppercase">Security</p>
            <h3 className="font-display mt-2 text-lg font-semibold">Secure by design</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Discord verification, protected endpoints, and desktop-only join flow keep casual IP
              leaks out of public channels.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
