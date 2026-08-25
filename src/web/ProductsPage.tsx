import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon } from '@/components/CloakLogo'
import { AdminIcon, DiscordMark, FiveMMark, ShieldCheckIcon } from '@/web/WebsiteIcons'

const userPoints = [
  { label: 'Discord community verification', Icon: DiscordMark },
  { label: 'Private FiveM joins without IP leaks', Icon: FiveMMark },
  { label: 'Admin-granted server access only', Icon: ShieldCheckIcon },
]

const adminPoints = [
  { label: 'Approve who can join each server', Icon: AdminIcon },
  { label: 'Manage warnings and penalties', Icon: ShieldCheckIcon },
  { label: 'Keep endpoints off public channels', Icon: FiveMMark },
]

export function ProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pt-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Products</p>
        <h1 className="mt-3 font-gropled text-4xl font-bold tracking-tight text-snow sm:text-5xl">
          Two apps. One protected ecosystem.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-mist">
          Cloak splits player access and server control into dedicated apps — so join links stay
          private and admins stay in charge.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <article className="flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-panel/70">
          <div className="relative overflow-hidden border-b border-line bg-ink px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.28),transparent_50%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CloakIcon size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-gropled text-2xl font-bold text-snow">Cloak User</h2>
                    <BetaBadge />
                  </div>
                  <p className="mt-1 text-sm text-mist">Desktop app for players</p>
                </div>
              </div>
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-signal uppercase">
                Available
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-8">
            <p className="text-sm leading-relaxed text-mist">
              Sign in with Discord, see only the servers you are granted, and join FiveM without
              pasting IPs into chat or clipboard.
            </p>
            <ul className="mt-6 space-y-3">
              {userPoints.map(({ label, Icon }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-snow">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink/80 text-signal">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs leading-relaxed text-mist">
              Download and run the Cloak desktop app on Windows. Website Google sign-in is for the
              public site only — the desktop app uses Discord.
            </p>
          </div>
        </article>

        <article className="flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-panel/70">
          <div className="relative overflow-hidden border-b border-line bg-ink px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(52,211,153,0.18),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(30,41,59,0.55),transparent_50%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-panel-2 shadow-[0_0_28px_rgba(52,211,153,0.15)]">
                  <img src="/cloak_app_icon.png" alt="" className="h-full w-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-ink/50" />
                  <span className="absolute bottom-1 right-1 rounded bg-signal px-1 text-[9px] font-bold text-void">
                    ADM
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-gropled text-2xl font-bold text-snow">Cloak Admin</h2>
                  </div>
                  <p className="mt-1 text-sm text-mist">Control panel for server owners</p>
                </div>
              </div>
              <span className="rounded-full border border-line bg-panel/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-mist uppercase">
                Coming next
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-8">
            <p className="text-sm leading-relaxed text-mist">
              Give staff a dedicated admin surface to grant access, issue warnings, and protect
              server endpoints — without publishing join links.
            </p>
            <ul className="mt-6 space-y-3">
              {adminPoints.map(({ label, Icon }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-snow">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink/80 text-signal">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs leading-relaxed text-mist">
              Cloak Admin is the next product in the ecosystem. Server owners and staff will manage
              access from here while players stay on Cloak User.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
