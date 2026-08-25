import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { getConvexUrl } from '@/lib/web'
import { useGoogleAuth } from '@/web/GoogleAuthContext'
import { DiscordMark } from '@/web/WebsiteIcons'

const DISCORD_INVITE = 'https://discord.gg/2KmAr9TUU'

type Category = 'install' | 'discord' | 'servers' | 'website' | 'other'
type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

type SupportIssue = {
  id: string
  category: Category
  subject: string
  description: string
  discordUsername: string | null
  preferDiscordSupport: boolean
  status: IssueStatus
  createdAt: number
  updatedAt: number
}

const createIssueFn = makeFunctionReference<
  'mutation',
  {
    sessionToken?: string
    email: string
    name: string
    category: Category
    subject: string
    description: string
    discordUsername?: string
    preferDiscordSupport: boolean
  },
  { id: string; status: 'open'; preferDiscordSupport: boolean }
>('support:createIssue')

const listMyIssuesFn = makeFunctionReference<'query', { sessionToken: string }, SupportIssue[]>(
  'support:listMyIssues',
)

const topics = [
  {
    id: 'install',
    title: 'Install & launch',
    items: [
      {
        q: 'Where do I download Cloak User?',
        a: 'Sign in on the website, open Product, then use Download for Windows. Run the NSIS installer (Cloak_*.exe) on Windows 10/11 x64.',
      },
      {
        q: 'Windows SmartScreen blocks the installer',
        a: 'Click More info → Run anyway if you downloaded Cloak from the official GitHub release. The app is not code-signed yet in beta.',
      },
      {
        q: 'Cloak opens then closes immediately',
        a: 'Reinstall from the latest release. If it still fails, delete %APPDATA%\\Cloak and open the app again, then sign in with Discord.',
      },
    ],
  },
  {
    id: 'discord',
    title: 'Discord sign-in',
    items: [
      {
        q: 'Sign-in says I am not in the Cloak Discord',
        a: 'Join the Cloak Discord first, accept any membership/verification rules, then try Continue with Discord again in the desktop app.',
      },
      {
        q: 'Discord browser window opens but nothing happens',
        a: 'Finish authorizing in the browser, then return to Cloak. Allow popups/redirects for localhost callback. Restart Cloak and retry if the window stayed open too long.',
      },
      {
        q: 'I signed in before but Cloak asks again',
        a: 'Sessions last about 30 days. If Discord membership changed or the session was cleared, sign in again. Signing out of Discord on this PC can also force a fresh login.',
      },
    ],
  },
  {
    id: 'servers',
    title: 'Servers & joining',
    items: [
      {
        q: 'My server list is empty',
        a: 'Cloak only shows servers a server admin granted you. Ask staff to approve your Discord account. Being in Discord alone is not enough.',
      },
      {
        q: 'Join does nothing / FiveM does not open',
        a: 'Install and update FiveM (Cfx.re). Keep FiveM closed or ready, then click Join again. Make sure Cloak is not blocked by antivirus.',
      },
      {
        q: 'Can I share join links from Cloak?',
        a: 'No. Connection details stay inside the app on purpose. Sharing IPs or join URLs violates Cloak terms and may lead to penalties.',
      },
    ],
  },
  {
    id: 'website',
    title: 'Website & Google sign-in',
    items: [
      {
        q: 'Google sign-in fails on the website',
        a: 'Use the hosted site URL (not a random preview). Allow popups. Website Google login is separate from the desktop Discord login.',
      },
      {
        q: 'I signed in with Google but cannot open Product',
        a: 'Product appears only after Google sign-in on the website. Desktop play still requires the Cloak User app and Discord.',
      },
    ],
  },
]

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'install', label: 'Install & launch' },
  { value: 'discord', label: 'Discord sign-in' },
  { value: 'servers', label: 'Servers & joining' },
  { value: 'website', label: 'Website & Google' },
  { value: 'other', label: 'Other' },
]

function client() {
  return new ConvexHttpClient(getConvexUrl())
}

function statusLabel(status: IssueStatus) {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In progress'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
  }
}

function formatWhen(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function CategorySelect({
  value,
  onChange,
  options,
}: {
  value: Category
  onChange: (value: Category) => void
  options: { value: Category; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((opt) => opt.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-panel/80 px-3 py-2.5 text-left text-snow outline-none ring-signal/40 transition hover:border-signal/40 focus:ring-2"
      >
        <span>{selected.label}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-mist transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Category"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-line bg-panel py-1 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={
                    isSelected
                      ? 'flex w-full px-3 py-2.5 text-left text-sm font-semibold text-signal bg-signal/10'
                      : 'flex w-full px-3 py-2.5 text-left text-sm text-snow transition hover:bg-panel-2 hover:text-signal'
                  }
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export function SupportPage() {
  const { user, sessionToken, signInWithGoogle, busy: authBusy } = useGoogleAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<Category>('install')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [preferDiscordSupport, setPreferDiscordSupport] = useState(false)
  const [discordUsername, setDiscordUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [issues, setIssues] = useState<SupportIssue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setName((prev) => prev || user.name)
    setEmail((prev) => prev || user.email)
  }, [user])

  const loadIssues = useCallback(async () => {
    if (!sessionToken) {
      setIssues([])
      return
    }
    setIssuesLoading(true)
    try {
      const rows = await client().query(listMyIssuesFn, { sessionToken })
      setIssues(rows)
    } catch {
      setIssues([])
    } finally {
      setIssuesLoading(false)
    }
  }, [sessionToken])

  useEffect(() => {
    void loadIssues()
  }, [loadIssues])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setSubmitting(true)
    try {
      const result = await client().mutation(createIssueFn, {
        sessionToken: sessionToken ?? undefined,
        email,
        name,
        category,
        subject,
        description,
        discordUsername: preferDiscordSupport ? discordUsername : undefined,
        preferDiscordSupport,
      })
      setSubject('')
      setDescription('')
      setPreferDiscordSupport(false)
      setDiscordUsername('')
      setFormSuccess(
        result.preferDiscordSupport
          ? 'Issue saved. Staff will also follow up on Discord — join the server if you have not already.'
          : 'Issue submitted. We will review it and update the status here when you are signed in.',
      )
      await loadIssues()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit the issue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pt-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Support</p>
        <h1 className="mt-3 font-gropled text-4xl font-bold tracking-tight text-snow sm:text-5xl">
          Fix issues with Cloak
        </h1>
        <p className="mt-4 text-base leading-relaxed text-mist">
          Browse common fixes, open a support ticket in Convex, and optionally ask staff to reach you
          on Discord.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#report"
            className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-void transition hover:bg-signal-bright"
          >
            Report an issue
          </a>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-[#5865F2]/15 px-5 py-2.5 text-sm font-bold text-snow transition hover:border-[#5865F2]/50"
          >
            <DiscordMark className="h-4 w-4" />
            Discord support
          </a>
        </div>
      </div>

      <section
        id="report"
        className="mt-12 scroll-mt-28 rounded-[1.75rem] border border-line bg-ink/70 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-gropled text-2xl font-bold text-snow">Report an issue</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
              Tickets are stored in the Cloak Convex backend. Sign in with Google to track status here.
              You can also request Discord support on the same form.
            </p>
          </div>
          {!user ? (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={authBusy}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-semibold text-mist transition hover:border-signal/40 hover:text-snow disabled:opacity-60"
            >
              {authBusy ? 'Signing in…' : 'Sign in with Google'}
            </button>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-snow">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-panel/80 px-3 py-2.5 text-snow outline-none ring-signal/40 focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-snow">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-panel/80 px-3 py-2.5 text-snow outline-none ring-signal/40 focus:ring-2"
            />
          </label>
          <div className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-snow">Category</span>
            <CategorySelect value={category} onChange={setCategory} options={categoryOptions} />
          </div>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-snow">Subject</span>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the problem"
              className="w-full rounded-xl border border-line bg-panel/80 px-3 py-2.5 text-snow outline-none ring-signal/40 focus:ring-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-snow">What happened?</span>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps, error text, and when it started. Do not include server IPs or join links."
              className="w-full resize-y rounded-xl border border-line bg-panel/80 px-3 py-2.5 text-snow outline-none ring-signal/40 focus:ring-2"
            />
          </label>

          <div className="sm:col-span-2 rounded-2xl border border-line bg-panel/50 p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={preferDiscordSupport}
                onChange={(e) => setPreferDiscordSupport(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line accent-signal"
              />
              <span>
                <span className="font-semibold text-snow">Include Discord support</span>
                <span className="mt-1 block text-mist">
                  Staff will try to help you in the Cloak Discord as well as via this ticket.
                </span>
              </span>
            </label>
            {preferDiscordSupport ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-snow">Discord username</span>
                  <input
                    required={preferDiscordSupport}
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="e.g. caps04"
                    className="w-full rounded-xl border border-line bg-ink/60 px-3 py-2.5 text-snow outline-none ring-signal/40 focus:ring-2"
                  />
                </label>
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#8ea1ff] transition hover:text-snow"
                >
                  <DiscordMark className="h-4 w-4" />
                  Open Cloak Discord
                </a>
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="sm:col-span-2 text-sm text-red-300">{formError}</p>
          ) : null}
          {formSuccess ? (
            <p className="sm:col-span-2 text-sm text-signal">{formSuccess}</p>
          ) : null}

          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-void transition hover:bg-signal-bright disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit issue'}
            </button>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-mist transition hover:border-signal/40 hover:text-snow"
            >
              <DiscordMark className="h-4 w-4" />
              Ask only on Discord
            </a>
          </div>
        </form>

        {user ? (
          <div className="mt-10 border-t border-line pt-8">
            <h3 className="text-lg font-semibold text-snow">Your issues</h3>
            {issuesLoading ? (
              <p className="mt-3 text-sm text-mist">Loading…</p>
            ) : issues.length === 0 ? (
              <p className="mt-3 text-sm text-mist">No tickets yet. Submit one above.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-2xl border border-line bg-panel/60 px-4 py-4 sm:px-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-mist">
                        {statusLabel(issue.status)}
                      </span>
                      {issue.preferDiscordSupport ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#5865F2]/20 px-2.5 py-0.5 text-xs font-semibold text-[#b5c0ff]">
                          <DiscordMark className="h-3 w-3" />
                          Discord
                        </span>
                      ) : null}
                      <span className="text-xs text-mist">{formatWhen(issue.createdAt)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-snow">{issue.subject}</p>
                    <p className="mt-1 text-sm text-mist line-clamp-3">{issue.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="rounded-2xl border border-line bg-panel/60 px-5 py-4 text-sm font-semibold text-snow transition hover:border-signal/40 hover:text-signal"
          >
            {topic.title}
          </a>
        ))}
      </div>

      <div className="mt-14 space-y-12">
        {topics.map((topic) => (
          <section key={topic.id} id={topic.id} className="scroll-mt-28">
            <h2 className="font-gropled text-2xl font-bold text-snow">{topic.title}</h2>
            <div className="mt-5 space-y-4">
              {topic.items.map((item) => (
                <article key={item.q} className="rounded-2xl border border-line bg-panel/70 p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-snow">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{item.a}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 rounded-[1.75rem] border border-line bg-ink/70 p-8 sm:p-10">
        <h2 className="font-gropled text-2xl font-bold text-snow">Still need help?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
          Prefer live chat? Open Discord and tell staff your Discord username, what you were doing,
          and any error text. Do not post server IPs or join links in public channels.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-bold text-snow transition hover:brightness-110"
          >
            <DiscordMark className="h-4 w-4" />
            Ask in Discord
          </a>
          <a
            href="#report"
            className="inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-mist transition hover:border-signal/40 hover:text-snow"
          >
            Open a ticket instead
          </a>
        </div>
      </section>
    </main>
  )
}
