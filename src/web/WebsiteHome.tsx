import { useState } from 'react'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon } from '@/components/CloakLogo'
import { TermsPanel } from '@/components/TermsPanel'
import { GoogleSignInButton } from '@/web/GoogleSignInButton'
import { trustedLogos } from '@/web/TrustedLogos'
import { useGoogleAuth } from '@/web/GoogleAuthContext'
import {
  AvatarBadge,
  CloakMark,
  DiscordMark,
  FiveMMark,
  IconShell,
  offers,
  QuoteIcon,
  whyPoints,
  workTiles,
  WorkTileBanner,
} from '@/web/WebsiteIcons'

type WebPage = 'home' | 'terms'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const voices = [
  { name: 'Alex', role: 'Server owner', quote: 'Players stop pasting join links. That alone is worth it.' },
  { name: 'Maya', role: 'Community lead', quote: 'Access is simple: Discord first, then admin approval.' },
  { name: 'Jonah', role: 'Player', quote: 'I open Cloak, pick a server, and FiveM launches. No hunting IPs.' },
  { name: 'Rin', role: 'Staff', quote: 'Warnings and penalties live in the app instead of buried Discord threads.' },
]

export function WebsiteHome() {
  const { user, logout } = useGoogleAuth()
  const [page, setPage] = useState<WebPage>('home')

  function goHome(section?: string) {
    setPage('home')
    if (!section) return
    window.setTimeout(() => scrollTo(section), 40)
  }

  return (
    <div className="relative z-10 min-h-full">
      <header className="sticky top-0 z-20 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5">
          <button type="button" onClick={() => goHome()} className="flex items-center gap-2 justify-self-start">
            <CloakIcon size="sm" />
            <span className="font-display text-sm font-bold tracking-tight text-snow">Cloak</span>
            <BetaBadge />
          </button>
          <nav className="hidden items-center justify-center gap-7 text-sm text-mist md:flex">
            <button type="button" onClick={() => goHome()} className="hover:text-snow">
              Home
            </button>
            <button type="button" onClick={() => goHome('offers')} className="hover:text-snow">
              Features
            </button>
            <button type="button" onClick={() => goHome('work')} className="hover:text-snow">
              Product
            </button>
            <button type="button" onClick={() => setPage('terms')} className="hover:text-snow">
              Terms
            </button>
          </nav>
          <div className="justify-self-end">
            {user ? (
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt=""
                    className="h-8 w-8 rounded-full border border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-signal px-4 py-2 text-xs font-bold text-void hover:bg-signal-bright"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <GoogleSignInButton compact variant="signal" label="Sign in" />
            )}
          </div>
        </div>
      </header>

      {page === 'terms' ? (
        <div className="mx-auto max-w-6xl px-6 py-10">
          <TermsPanel />
        </div>
      ) : (
        <main>
          <section className="mx-auto max-w-4xl px-6 pb-8 pt-16 text-center sm:pt-24">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-snow sm:text-7xl">
              Join without{' '}
              <span className="bg-gradient-to-r from-signal to-signal-bright bg-clip-text text-transparent">
                leaking IPs
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist">
              Cloak is the desktop connector for protected FiveM servers. Connection details stay
              inside the app. Admins decide who can join.
            </p>
            <div className="mx-auto mt-8 flex max-w-lg flex-col items-center justify-center gap-3 sm:flex-row">
              {user ? (
                <p className="flex items-center gap-2 rounded-full border border-line bg-ink/60 px-5 py-3 text-sm text-mist">
                  Signed in as <span className="font-semibold text-snow">{user.name}</span>
                </p>
              ) : (
                <GoogleSignInButton variant="signal" label="Sign in with Google" />
              )}
            </div>
          </section>

          <section className="border-y border-line/50 py-8">
            <p className="text-center text-xs tracking-[0.2em] text-mist uppercase">
              Built for protected FiveM communities
            </p>
            <div className="mt-6 overflow-hidden">
              <div className="animate-marquee flex w-max items-center gap-16 px-8">
                {[...trustedLogos, ...trustedLogos].map(({ id, Logo }, index) => (
                  <Logo key={`${id}-${index}`} />
                ))}
              </div>
            </div>
          </section>

          <section id="offers" className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-center text-4xl font-bold text-snow">We offer</h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((item) => (
                <article key={item.title} className="rounded-2xl border border-line bg-panel/70 p-6">
                  {item.visual.type === 'brand' ? (
                    <IconShell tint={item.visual.tint}>
                      <item.visual.Mark className="h-5 w-5" />
                    </IconShell>
                  ) : (
                    <IconShell tint={item.visual.tint}>
                      <item.visual.Icon className="h-5 w-5" />
                    </IconShell>
                  )}
                  <h3 className="text-lg font-semibold text-snow">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="why" className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-ink p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.32),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(21,128,61,0.28),transparent_50%)]" />
              <img
                src="/cloak_app_icon.png"
                alt=""
                className="relative mx-auto h-64 w-64 object-contain drop-shadow-[0_0_40px_rgba(34,197,94,0.35)]"
              />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold text-snow">Why choose us</h2>
              <p className="mt-5 text-sm leading-relaxed text-mist">
                Cloak exists so FiveM communities can invite players without publishing join links.
                Discord verifies who you are. Admins control which servers you see. The desktop app
                keeps endpoints off public channels.
              </p>
              <ul className="mt-6 space-y-4">
                {whyPoints.map(({ text, Icon, tint }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink/80"
                      style={{ color: tint }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-relaxed text-mist">{text}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPage('terms')}
                className="mt-6 text-sm font-semibold text-signal hover:text-signal-bright"
              >
                Read the terms →
              </button>
            </div>
          </section>

          <section id="work" className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-center text-4xl font-bold text-snow">
              Some pieces of our work
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {workTiles.map((item) => {
                const BannerIcon = item.banner
                return (
                  <article key={item.title} className="overflow-hidden rounded-2xl border border-line bg-panel/60">
                    <WorkTileBanner accent={item.accent}>
                      <span style={{ color: item.accent }}>
                        <BannerIcon className="h-14 w-14" />
                      </span>
                    </WorkTileBanner>
                    <div className="p-5">
                      <p className="text-xs font-semibold tracking-wide text-signal uppercase">{item.tag}</p>
                      <h3 className="mt-2 text-lg font-semibold text-snow">{item.title}</h3>
                      <p className="mt-1 text-sm text-mist">{item.body}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-16">
            <h2 className="font-display text-3xl font-bold text-snow">What communities say</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voices.map((item) => (
                <article key={item.name} className="rounded-2xl border border-line bg-panel/70 p-5">
                  <AvatarBadge name={item.name} role={item.role} />
                  <p className="text-sm font-semibold text-snow">{item.name}</p>
                  <p className="text-xs text-mist">{item.role}</p>
                  <QuoteIcon className="mt-3 h-4 w-4 text-signal/50" />
                  <p className="mt-2 text-sm leading-relaxed text-mist">“{item.quote}”</p>
                </article>
              ))}
            </div>
          </section>

          <section className="px-6 pb-16">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl bg-signal px-8 py-10 text-void sm:flex-row">
              <div className="flex items-center gap-4">
                <CloakMark className="h-10 w-10" />
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Ready to join the right way?
                </h2>
              </div>
              {user ? (
                <p className="text-sm font-semibold">You are signed in. Open the desktop app next.</p>
              ) : (
                <GoogleSignInButton compact variant="snow" label="Sign in with Google" />
              )}
            </div>
          </section>

          <footer className="border-t border-line/70 px-6 py-12">
            <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-semibold text-snow">Product</p>
                <button type="button" onClick={() => goHome('offers')} className="mt-3 flex items-center gap-2 text-sm text-mist hover:text-snow">
                  <FiveMMark className="h-4 w-4 text-[#F40552]" /> Features
                </button>
                <button type="button" onClick={() => goHome('why')} className="mt-2 flex items-center gap-2 text-sm text-mist hover:text-snow">
                  <CloakMark className="h-4 w-4" /> Why Cloak
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-snow">App</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-mist">
                  <CloakMark className="h-4 w-4" /> Desktop connector
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-mist">
                  <DiscordMark className="h-4 w-4 text-[#5865F2]" /> Discord verified
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-snow">Legal</p>
                <button type="button" onClick={() => setPage('terms')} className="mt-3 block text-sm text-mist hover:text-snow">
                  Terms
                </button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CloakIcon size="sm" />
                  <span className="font-display font-bold">Cloak</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-mist">
                  © 2026 Cloak. Join without leaking IPs.
                </p>
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  )
}
