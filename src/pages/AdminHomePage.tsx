import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { CloakIcon } from '@/components/CloakLogo'
import { avatarUrl, displayName } from '@/lib/types'

type NavId = 'overview' | 'servers' | 'access' | 'warnings' | 'penalties' | 'support'

const NAV_ITEMS: { id: NavId; label: string; hint: string }[] = [
  { id: 'overview', label: 'Command', hint: 'At a glance' },
  { id: 'servers', label: 'Servers', hint: 'Private endpoints' },
  { id: 'access', label: 'Roster', hint: 'Who can join' },
  { id: 'warnings', label: 'Warnings', hint: 'Player notices' },
  { id: 'penalties', label: 'Penalties', hint: 'Outstanding dues' },
  { id: 'support', label: 'Tickets', hint: 'Staff queue' },
]

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-warn/20 bg-[#14110e]/80 px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-warn/80 uppercase">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-snow">{value}</p>
    </div>
  )
}

export function AdminHomePage() {
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState<NavId>('overview')

  if (!user) return null

  const name = displayName(user)
  const active = NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0]

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
      {/* Top command bar — not a player-style left sidebar */}
      <header className="shrink-0 border-b border-warn/20 bg-[#100e0c]/90 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CloakIcon size="md" variant="app" />
              <span className="absolute -right-1 -bottom-1 rounded bg-warn px-1.5 py-0.5 text-[8px] font-bold text-void">
                ADM
              </span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-snow">Cloak Admin</p>
              <p className="text-[11px] text-warn/85">Connect Players at your Desire</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-snow">{name}</p>
              <p className="text-xs text-mist">@{user.username} · staff</p>
            </div>
            <img
              src={avatarUrl(user)}
              alt=""
              className="h-10 w-10 rounded-full border border-warn/30 object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={logout}
              className="no-drag rounded-full border border-warn/30 px-3 py-1.5 text-xs font-semibold text-warn transition hover:bg-warn/10"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const on = item.id === activeNav
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`no-drag shrink-0 rounded-xl px-3 py-2 text-left transition ${
                  on
                    ? 'bg-warn text-void shadow-[0_0_24px_rgba(240,180,90,0.35)]'
                    : 'border border-transparent text-mist hover:border-warn/20 hover:bg-[#1a1612] hover:text-snow'
                }`}
              >
                <p className="text-xs font-bold">{item.label}</p>
                <p className={`text-[10px] ${on ? 'text-void/70' : 'text-mist/70'}`}>{item.hint}</p>
              </button>
            )
          })}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-warn uppercase">
              Staff workspace
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold text-snow">{active.label}</h1>
            <p className="mt-1 text-sm text-mist">{active.hint}</p>
          </div>
        </div>

        {activeNav === 'overview' ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatChip label="Servers" value="0" />
              <StatChip label="Access grants" value="0" />
              <StatChip label="Open warnings" value="0" />
              <StatChip label="Penalties" value="0" />
            </div>

            <section className="overflow-hidden rounded-3xl border border-warn/20 bg-gradient-to-br from-[#1a1510] to-[#0c0b0a] px-6 py-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-warn uppercase">
                Next up
              </p>
              <h2 className="font-display mt-2 max-w-xl text-2xl font-bold text-snow">
                Build your private server roster, then approve players by Discord.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
                This console stays separate from Cloak Desktop. Players never see endpoints; you
                decide who gets in.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Add server', 'Invite access', 'Issue warning'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    className="rounded-full border border-warn/25 px-4 py-2 text-xs font-semibold text-warn/70 opacity-70"
                  >
                    {label} · soon
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeNav === 'servers' ? (
          <section className="rounded-3xl border border-dashed border-warn/30 bg-[#12100e]/80 px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-snow">No servers on the board</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mist">
              Register FiveM endpoints here privately. They never appear in Discord chat — only
              granted players see them in Cloak Desktop.
            </p>
          </section>
        ) : null}

        {activeNav === 'access' ? (
          <section className="rounded-3xl border border-dashed border-warn/30 bg-[#12100e]/80 px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-snow">Roster is empty</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mist">
              Approve Discord accounts per server. That list drives what players see after they
              sign in to Cloak Desktop.
            </p>
          </section>
        ) : null}

        {activeNav === 'warnings' ? (
          <section className="rounded-3xl border border-dashed border-warn/30 bg-[#12100e]/80 px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-snow">No warnings filed</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mist">
              Warnings you issue will show inside the player app — not buried in Discord threads.
            </p>
          </section>
        ) : null}

        {activeNav === 'penalties' ? (
          <section className="rounded-3xl border border-dashed border-warn/30 bg-[#12100e]/80 px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-snow">No penalties open</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mist">
              Track outstanding penalties here; players will see their balance in Cloak Desktop.
            </p>
          </section>
        ) : null}

        {activeNav === 'support' ? (
          <section className="rounded-3xl border border-dashed border-warn/30 bg-[#12100e]/80 px-6 py-16 text-center">
            <p className="font-display text-2xl font-bold text-snow">No staff tickets yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mist">
              Website support issues and Discord follow-ups will land in this queue for admins.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  )
}
