import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useUnauthorizedPoison } from '@/context/UnauthorizedPoisonContext'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon } from '@/components/CloakLogo'
import { ServerCard } from '@/components/ServerCard'
import { TermsPanel } from '@/components/TermsPanel'
import { UpdatesPanel } from '@/components/UpdatesPanel'
import type { CloakServer } from '@/lib/servers'
import { TERMS_SECTIONS, scrollToTermsSection } from '@/lib/terms'
import { avatarUrl, displayName } from '@/lib/types'

type NavId = 'servers' | 'support' | 'warnings' | 'penalties' | 'terms' | 'updates'

const NAV_ITEMS: { id: NavId; label: string }[] = [
  { id: 'servers', label: 'Servers' },
  { id: 'support', label: 'Support' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'penalties', label: 'Penalties' },
  { id: 'updates', label: 'Updates' },
  { id: 'terms', label: 'Terms' },
]

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M15 6 9 12l6 6" />
    </svg>
  )
}

function ServerEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M32 6 10 14v18c0 14 9.2 25.5 22 27 12.8-1.5 22-13 22-27V14L32 6Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="22" y="24" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M26 30h12M26 35h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="35" r="1.4" fill="currentColor" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.5 11.5 0 0 1-1.7 3.1" />
      <path d="M6.1 6.1A11.6 11.6 0 0 0 1 12.5C2.7 16.9 7 20 12 20a9.7 9.7 0 0 0 4.3-1" />
    </svg>
  )
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}

function EmptyPanel({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/50 px-6 py-14 text-center panel-glow">
      <p className="font-display text-2xl font-bold tracking-tight text-snow">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist">{body}</p>
    </div>
  )
}

function ServersPanel({
  onJoin,
}: {
  onJoin: (serverId: string) => Promise<{ ok: boolean; message: string }>
}) {
  const { user } = useAuth()
  const { activate } = useUnauthorizedPoison()
  const [servers, setServers] = useState<CloakServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setServers([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const result = await window.cloak?.listPlayerServers()
    if (!result) {
      setServers([])
      setError('Run Cloak as a desktop app to load your servers.')
      setLoading(false)
      return
    }
    if (result.unauthorized) {
      activate('unauthorized-server-list')
    }
    setServers(result.servers)
    if (!result.ok) setError(result.error ?? 'Could not load servers.')
    setLoading(false)
  }, [user, activate])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => {
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-snow">Your servers</h2>
          <p className="mt-1 text-sm text-mist">
            Servers appear here after a Server Admin invites your Discord username.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || !user}
          className="no-drag rounded-xl border border-line px-3 py-2 text-xs font-medium text-mist transition hover:border-snow/20 hover:text-snow disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          {error}
        </p>
      ) : null}

      {loading && servers.length === 0 ? (
        <p className="text-sm text-mist">Loading your servers…</p>
      ) : servers.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel/50 px-6 py-14 text-center panel-glow">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 55% 45% at 50% 28%, rgba(34,197,94,0.16), transparent 70%)',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
            }}
            aria-hidden
          />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-signal/25 bg-signal/10 text-signal shadow-[0_0_40px_rgba(34,197,94,0.22)]">
            <ServerEmptyIcon className="h-11 w-11" />
          </div>

          <p className="font-display relative mt-6 text-2xl font-bold tracking-tight text-snow">
            No servers yet
          </p>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist">
            Ask a Server Admin to invite{' '}
            <span className="font-semibold text-snow">@{user?.username ?? 'your Discord'}</span> on
            their Roster. Once approved, the server card shows up here.
          </p>

          <div className="relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5 text-xs font-medium text-mist">
              <LockIcon className="h-3.5 w-3.5 text-signal" />
              Protected joins
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5 text-xs font-medium text-mist">
              <EyeOffIcon className="h-3.5 w-3.5 text-signal" />
              IP stays hidden
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5 text-xs font-medium text-mist">
              <SparkIcon className="h-3.5 w-3.5 text-signal" />
              Admin-granted access
            </span>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} onJoin={onJoin} />
          ))}
        </div>
      )}
    </section>
  )
}

export function HomePage() {
  const { user, logout } = useAuth()
  const { activate } = useUnauthorizedPoison()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState<NavId>('servers')
  const [activeTermsSection, setActiveTermsSection] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)

  const handleJoin = useCallback(async (serverId: string) => {
    if (window.cloak?.joinServer) {
      const result = await window.cloak.joinServer(serverId)
      if (result.unauthorized) activate('unauthorized-join')
      return result
    }
    return {
      ok: false,
      message: 'Run Cloak as a desktop app to connect to servers.',
    }
  }, [activate])

  useEffect(() => {
    const api = window.cloak
    if (!api) return

    const off = api.onUpdateAvailable?.((info) => {
      setUpdateAvailable(info.update)
      setUpdateVersion(info.update ? info.newVersion || null : null)
    })

    // Check as soon as the shell loads so the Updates badge appears without opening the page.
    void api.checkForUpdates?.().catch(() => undefined)

    return () => off?.()
  }, [])

  if (!user) return null

  const name = displayName(user)

  return (
    <div className="relative z-10 flex h-full min-h-0 overflow-hidden">
      <aside
        className={`cloak-sidebar flex h-full shrink-0 flex-col overflow-hidden border-r border-line/80 bg-panel/40 ${
          sidebarOpen ? 'cloak-sidebar-open' : 'cloak-sidebar-closed'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={`flex h-full min-h-0 w-64 flex-col px-5 py-6 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            sidebarOpen
              ? 'translate-x-0 opacity-100 delay-75'
              : 'pointer-events-none -translate-x-3 opacity-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <CloakIcon size="md" variant="app" />
            <div className="min-w-0 flex-1">
              <BetaBadge className="shrink-0" />
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              tabIndex={sidebarOpen ? 0 : -1}
              className="no-drag inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-ink/50 text-mist transition hover:border-snow/20 hover:text-snow"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm">
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeNav
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    tabIndex={sidebarOpen ? 0 : -1}
                    className={`no-drag flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-medium transition ${
                      active
                        ? 'bg-signal/10 text-signal'
                        : 'text-mist hover:bg-ink/60 hover:text-snow'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.id === 'updates' && updateAvailable ? (
                      <span className="flex items-center gap-1.5">
                        <span className="rounded-full bg-signal/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-signal uppercase">
                          New
                        </span>
                        <span className="h-2 w-2 rounded-full bg-signal" aria-label="Update available" />
                      </span>
                    ) : null}
                  </button>

                  {item.id === 'terms' && activeNav === 'terms' && (
                    <div className="mt-1 ml-2 space-y-0.5 border-l border-line/60 pl-2">
                      {TERMS_SECTIONS.map((section) => {
                        const sectionActive = activeTermsSection === section.id
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => {
                              setActiveTermsSection(section.id)
                              scrollToTermsSection(section.id)
                            }}
                            tabIndex={sidebarOpen ? 0 : -1}
                            title={section.title.replace(/\*\*/g, '')}
                            className={`no-drag w-full truncate rounded-md px-2 py-1.5 text-left text-[11px] leading-snug transition ${
                              sectionActive
                                ? 'bg-signal/10 font-medium text-signal'
                                : 'text-mist/90 hover:bg-ink/60 hover:text-snow'
                            }`}
                          >
                            {section.shortLabel.replace(/\*\*/g, '')}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-line pt-4">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl(user)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-snow">{name}</p>
                <p className="truncate text-xs text-mist">@{user.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              tabIndex={sidebarOpen ? 0 : -1}
              className="no-drag mt-3 w-full rounded-lg border border-line px-3 py-2 text-xs font-medium text-mist transition hover:border-snow/20 hover:text-snow"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6 lg:px-8">
        {updateAvailable && activeNav !== 'updates' ? (
          <div className="animate-rise mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-signal/30 bg-signal/10 px-4 py-3">
            <p className="text-sm text-snow">
              <span className="font-semibold text-signal">Update ready.</span>{' '}
              {updateVersion ? (
                <>
                  Cloak Desktop <span className="font-semibold">v{updateVersion}</span> is available.
                </>
              ) : (
                <>A newer Cloak Desktop build is available.</>
              )}
            </p>
            <button
              type="button"
              onClick={() => setActiveNav('updates')}
              className="no-drag rounded-full bg-signal px-4 py-2 text-xs font-bold text-void transition hover:bg-signal-bright"
            >
              Download & install
            </button>
          </div>
        ) : null}

        <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-hidden={sidebarOpen}
              tabIndex={sidebarOpen ? -1 : 0}
              className={`no-drag mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel/60 text-mist transition-[opacity,transform,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-snow/20 hover:text-snow ${
                sidebarOpen
                  ? 'pointer-events-none w-0 scale-90 overflow-hidden border-transparent opacity-0'
                  : 'scale-100 opacity-100'
              }`}
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-snow">
                Welcome back, {name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-mist">
                Join through Cloak — the real IP never shows up in your clipboard or chat.
              </p>
            </div>
          </div>

          {!sidebarOpen && (
            <div className="no-drag flex items-center gap-3">
              <img
                src={avatarUrl(user)}
                alt=""
                className="h-10 w-10 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-mist transition hover:border-snow/20 hover:text-snow"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="animate-rise-delay mt-8">
          {activeNav === 'servers' && <ServersPanel onJoin={handleJoin} />}
          {activeNav === 'support' && (
            <EmptyPanel
              title="Support"
              body="Need help with Cloak or a protected server? Support channels will appear here."
            />
          )}
          {activeNav === 'warnings' && (
            <EmptyPanel
              title="Warnings"
              body="You have no warnings. Server admins will list them here if any are issued."
            />
          )}
          {activeNav === 'penalties' && (
            <EmptyPanel
              title="Penalties"
              body="You have nothing to pay. Outstanding penalties from server admins will show here."
            />
          )}
          {activeNav === 'updates' && (
            <UpdatesPanel
              updateAvailable={updateAvailable}
              updateVersion={updateVersion}
              onAvailability={(available, info) => {
                setUpdateAvailable(available)
                setUpdateVersion(available ? info?.newVersion || null : null)
              }}
            />
          )}
          {activeNav === 'terms' && <TermsPanel />}
        </div>
      </main>
    </div>
  )
}
