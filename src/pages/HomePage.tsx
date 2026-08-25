import { useAuth } from '@/context/AuthContext'
import { avatarUrl, displayName } from '@/lib/types'

export function HomePage() {
  const { user, logout } = useAuth()
  if (!user) return null

  const name = displayName(user)

  return (
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-2.25rem)] w-full max-w-5xl flex-col px-8 pb-10 pt-6">
      <div className="animate-rise flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em] text-signal uppercase">Signed in</p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-snow">
            Welcome back, {name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-mist">
            Your secure join space. Server connections and leak protection land here next.
          </p>
        </div>

        <div className="no-drag flex items-center gap-3">
          <img
            src={avatarUrl(user)}
            alt=""
            className="h-11 w-11 rounded-full border border-line object-cover"
          />
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-mist transition hover:border-snow/20 hover:text-snow"
          >
            Sign out
          </button>
        </div>
      </div>

      <section className="animate-rise-delay mt-12 grid flex-1 gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-signal/10 blur-2xl" />
          <p className="text-xs tracking-[0.22em] text-mist uppercase">Protected join</p>
          <h2 className="font-display mt-3 text-2xl font-semibold">Servers</h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Approved FiveM servers will show here. One tap join — no raw IP ever leaves the app.
          </p>
          <button
            type="button"
            disabled
            className="no-drag mt-6 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-void opacity-40"
          >
            Coming soon
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-ink/80 p-6">
          <p className="text-xs tracking-[0.22em] text-mist uppercase">Leak watch</p>
          <h2 className="font-display mt-3 text-2xl font-semibold">Clipboard shield</h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            If a join link is copied or shared outside Cloak, the admin side gets an alert right
            away.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-signal-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
            Monitoring hooks arrive after Discord guild access is locked in
          </div>
        </div>
      </section>
    </main>
  )
}
