import { useEffect, useState } from 'react'
import { BetaBadge } from '@/components/BetaBadge'
import { CloakIcon, CLOAK_APP_ICON_SRC } from '@/components/CloakLogo'
import { TermsPanel } from '@/components/TermsPanel'
import { GoogleSignInButton } from '@/web/GoogleSignInButton'
import { ProductsPage } from '@/web/ProductsPage'
import { SupportPage } from '@/web/SupportPage'
import { trustedLogos } from '@/web/TrustedLogos'
import { useGoogleAuth } from '@/web/GoogleAuthContext'
import {
  AvatarBadge,
  CloakMark,
  DiscordMark,
  IconShell,
  offers,
  QuoteIcon,
  whyPoints,
} from '@/web/WebsiteIcons'

type WebPage = 'home' | 'terms' | 'products' | 'support'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function pathToPage(pathname: string): WebPage {
  const path = pathname.replace(/\/+$/, '').toLowerCase()
  if (path === '/products') return 'products'
  if (path === '/terms') return 'terms'
  if (path === '/support') return 'support'
  return 'home'
}

function pageToPath(page: WebPage) {
  if (page === 'products') return '/products'
  if (page === 'terms') return '/terms'
  if (page === 'support') return '/support'
  return '/'
}

const voices = [
  {
    name: 'Alex',
    role: 'Server owner',
    quote: 'Players stop pasting join links. That alone is worth it.',
    photo: '/reviews/alex.jpg',
  },
  {
    name: 'Maya',
    role: 'Community lead',
    quote: 'Access is simple: Discord first, then admin approval.',
    photo: '/reviews/maya.jpg',
  },
  {
    name: 'Jonah',
    role: 'Player',
    quote: 'I open Cloak, pick a server, and FiveM launches. No hunting IPs.',
    photo: '/reviews/jonah.jpg',
  },
  {
    name: 'Rin',
    role: 'Staff',
    quote: 'Warnings and penalties live in the app instead of buried Discord threads.',
    photo: '/reviews/rin.jpg',
  },
]

export function WebsiteHome() {
  const { user, logout } = useGoogleAuth()
  const [page, setPage] = useState<WebPage>(() =>
    typeof window !== 'undefined' ? pathToPage(window.location.pathname) : 'home',
  )

  function navigate(next: WebPage) {
    setPage(next)
    const path = pageToPath(next)
    if (window.location.pathname !== path) {
      window.history.pushState({ page: next }, '', path)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome(section?: string) {
    navigate('home')
    if (!section) return
    window.setTimeout(() => scrollTo(section), 40)
  }

  function goProducts() {
    if (!user) {
      goHome()
      return
    }
    navigate('products')
  }

  useEffect(() => {
    function onPopState() {
      setPage(pathToPage(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (page === 'products' && !user) {
      navigate('home')
    }
  }, [page, user])

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
            <button
              type="button"
              onClick={() => goHome()}
              className={page === 'home' ? 'text-snow' : 'hover:text-snow'}
            >
              Home
            </button>
            <button type="button" onClick={() => goHome('offers')} className="hover:text-snow">
              Features
            </button>
            {user && (
              <button
                type="button"
                onClick={goProducts}
                className={page === 'products' ? 'text-snow' : 'hover:text-snow'}
              >
                Product
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('terms')}
              className={page === 'terms' ? 'text-snow' : 'hover:text-snow'}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => navigate('support')}
              className={page === 'support' ? 'text-snow' : 'hover:text-snow'}
            >
              Support
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

      {page === 'terms' && (
        <div className="mx-auto max-w-6xl px-6 py-10">
          <TermsPanel />
        </div>
      )}

      {page === 'products' && user && <ProductsPage />}

      {page === 'support' && <SupportPage />}

      {page === 'home' && (
        <main>
          <section className="mx-auto max-w-4xl px-6 pb-8 pt-16 text-center sm:pt-24">
            <h1 className="font-gropled text-5xl font-bold tracking-tight text-snow sm:text-7xl">
              Join without{' '}
              <span className="bg-gradient-to-r from-signal to-signal-bright bg-clip-text text-transparent">
                leaking IPs
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist">
              Cloak is the desktop connector for protected FiveM servers. Connection details stay
              inside the app. Admins decide who can join.
            </p>
            {!user && (
              <div className="mx-auto mt-8 flex max-w-lg flex-col items-center justify-center gap-3 sm:flex-row">
                <GoogleSignInButton variant="signal" label="Sign in with Google" />
              </div>
            )}
          </section>

          <section className="border-y border-line/50 py-8">
            <p className="text-center text-xs tracking-[0.2em] text-mist uppercase">
              Built for protected FiveM communities
            </p>
            <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className="animate-marquee flex w-max items-center">
                {[0, 1].map((copy) => (
                  <ul
                    key={copy}
                    className="flex shrink-0 items-center gap-16 pr-16"
                    aria-hidden={copy === 1}
                  >
                    {trustedLogos.map(({ id, Logo }) => (
                      <li key={`${copy}-${id}`}>
                        <Logo />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </section>

          <section id="offers" className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-gropled text-center text-4xl font-bold text-snow">We offer</h2>
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
                src={CLOAK_APP_ICON_SRC}
                alt=""
                className="relative mx-auto h-64 w-64 object-contain drop-shadow-[0_0_40px_rgba(34,197,94,0.35)]"
              />
            </div>
            <div>
              <h2 className="font-gropled text-4xl font-bold text-snow">Why choose us</h2>
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
                onClick={() => navigate('terms')}
                className="mt-6 text-sm font-semibold text-signal hover:text-signal-bright"
              >
                Read the terms →
              </button>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-16">
            <h2 className="font-gropled text-3xl font-bold text-snow">What communities say</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voices.map((item) => (
                <article key={item.name} className="rounded-2xl border border-line bg-panel/70 p-5">
                  <AvatarBadge name={item.name} role={item.role} photo={item.photo} />
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
                <h2 className="font-gropled text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to join the right way?
                </h2>
              </div>
              {!user && (
                <GoogleSignInButton compact variant="snow" label="Sign in with Google" />
              )}
            </div>
          </section>
        </main>
      )}

      {page !== 'terms' && (
        <footer className="border-t border-line/70 bg-ink/40">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div className="max-w-xs">
                <div className="flex items-center gap-2.5">
                  <CloakIcon size="sm" />
                  <div>
                    <p className="font-display text-base font-bold tracking-tight text-snow">Cloak</p>
                    <p className="text-[11px] tracking-wide text-mist uppercase">Beta</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-mist">
                  Desktop connector for protected FiveM servers. Join without leaking IPs.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-snow uppercase">Explore</p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <button type="button" onClick={() => goHome()} className="text-sm text-mist transition hover:text-snow">
                      Home
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => goHome('offers')} className="text-sm text-mist transition hover:text-snow">
                      Features
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => goHome('why')} className="text-sm text-mist transition hover:text-snow">
                      Why Cloak
                    </button>
                  </li>
                  {user && (
                    <li>
                      <button type="button" onClick={goProducts} className="text-sm text-mist transition hover:text-snow">
                        Product
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-snow uppercase">App</p>
                <ul className="mt-4 space-y-2.5 text-sm text-mist">
                  <li>Desktop connector</li>
                  <li>Discord verified login</li>
                  <li>Admin-granted servers</li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-snow uppercase">Legal</p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <button type="button" onClick={() => navigate('terms')} className="text-sm text-mist transition hover:text-snow">
                      Terms of use
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => navigate('support')} className="text-sm text-mist transition hover:text-snow">
                      Support
                    </button>
                  </li>
                  <li>
                    <a
                      href="https://discord.gg/2KmAr9TUU"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-mist transition hover:text-snow"
                    >
                      <DiscordMark className="h-4 w-4 text-[#5865F2]" />
                      Discord community
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line/70 pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-mist">© 2026 Cloak. All rights reserved.</p>
              <p className="text-xs text-mist">Join without leaking IPs.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
