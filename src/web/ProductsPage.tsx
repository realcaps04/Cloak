import { useEffect, useState } from 'react'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon, CLOAK_APP_ICON_SRC } from '@/components/CloakLogo'
import { fetchLatestCloakRelease, getCloakDownloadUrl } from '@/lib/web'
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

const installSteps = [
  'Download the Windows app (x64).',
  'Run Cloak.exe and complete setup.',
  'Open Cloak Desktop and sign in with Discord.',
  'Join only the servers an admin grants you.',
]

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.5 10.5 4.4v7.1H3V5.5Zm8.2-1.3L21 3v8.5h-9.8V4.2ZM3 13.5h7.5V20.6L3 19.5v-6Zm8.2 0H21V21l-9.8-1.4v-6.1Z" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 4v10M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18h14" strokeLinecap="round" />
    </svg>
  )
}

export function ProductsPage() {
  const [downloadUrl, setDownloadUrl] = useState(getCloakDownloadUrl())
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchLatestCloakRelease().then((release) => {
      if (cancelled) return
      setDownloadUrl(release.downloadUrl)
      setVersion(release.version === 'latest' ? null : release.version)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
                    <h2 className="font-gropled text-2xl font-bold text-snow">Cloak Desktop</h2>
                    <BetaBadge />
                  </div>
                  <p className="mt-1 text-sm text-mist">
                    Desktop app for players{version ? ` · v${version}` : ' · latest release'}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-signal uppercase">
                Download ready
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-8">
            <p className="text-sm leading-relaxed text-mist">
              Install Cloak Desktop on your PC, sign in with Discord, and join protected FiveM servers
              without pasting IPs into chat or clipboard.
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

            <div className="mt-8 rounded-2xl border border-line bg-ink/50 p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-snow uppercase">Install on your device</p>
              <ol className="mt-3 space-y-2">
                {installSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-mist">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 text-xs font-bold text-signal">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={downloadUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-bold text-void transition hover:bg-signal-bright"
              >
                <DownloadIcon className="h-4 w-4" />
                Download for Windows
              </a>
              <div className="inline-flex items-center gap-2 text-xs text-mist">
                <WindowsIcon className="h-4 w-4 text-mist" />
                Windows 10/11 · x64 · latest release
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-mist">
              Website Google sign-in is for this site only. The desktop app uses Discord membership
              to verify you before showing servers.
            </p>
          </div>
        </article>

        <article className="flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-panel/70">
          <div className="relative overflow-hidden border-b border-line bg-ink px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(52,211,153,0.18),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(30,41,59,0.55),transparent_50%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-panel-2 shadow-[0_0_28px_rgba(52,211,153,0.15)]">
                  <img src={CLOAK_APP_ICON_SRC} alt="" className="h-full w-full object-cover opacity-90" />
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
            <button
              type="button"
              disabled
              className="mt-8 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-line bg-panel/60 px-6 py-3 text-sm font-bold text-mist opacity-70"
            >
              Download unavailable
            </button>
            <p className="mt-5 text-xs leading-relaxed text-mist">
              Cloak Admin is the next product. Server owners will manage access here while players
              use Cloak Desktop.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
