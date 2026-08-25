import type { ComponentType, ReactNode } from 'react'
import { CloakIcon } from '@/components/CloakLogo'

type IconProps = { className?: string }

/* ── Brand marks (official Simple Icons paths) ── */

export function FiveMMark({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.4 24h-5.225c-.117 0-.455-1.127-1.026-3.375-1.982-6.909-3.124-10.946-3.417-12.12l3.37-3.325h.099c.454 1.42 2.554 7.676 6.299 18.768ZM12.342 7.084h-.048a3.382 3.385 0 0 1-.098-.492v-.098a102.619 102.715 0 0 1 3.272-3.275c.13.196.196.356.196.491v.05a140.694 140.826 0 0 1-3.322 3.324ZM5.994 10.9h-.05c.67-2.12 1.076-3.209 1.223-3.275L14.492.343c.08 0 .258.524.533 1.562zm1.37-4.014h-.05C8.813 2.342 9.612.048 9.71 0h4.495v.05a664.971 664.971 0 0 1-6.841 6.839Zm-2.69 7.874h-.05c.166-.798.554-1.418 1.174-1.855a312.918 313.213 0 0 1 5.71-5.717h.05c-.117.672-.375 1.175-.781 1.52zM1.598 24l-.098-.05c1.399-4.172 2.148-6.322 2.248-6.45l6.74-6.694v.05C10.232 11.88 8.974 16.263 6.73 24Z" />
    </svg>
  )
}

export function DiscordMark({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export function CfxMark({ className = 'h-5 w-auto' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 72 20" fill="currentColor" aria-hidden>
      <text x="0" y="16" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="16" fontWeight="700" letterSpacing="-0.03em">
        cfx.re
      </text>
    </svg>
  )
}

export function GoogleMark({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function CloakMark({ className }: IconProps) {
  return <CloakIcon size="sm" className={className ?? 'h-7 w-7 shadow-none'} />
}

/* ── Feature icons ── */

export function LinkOffIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10 13a5 5 0 0 1 7.07 0l1.41 1.41a5 5 0 0 1 0 7.07 5 5 0 0 1-7.07 0" strokeLinecap="round" />
      <path d="M14 9a5 5 0 0 0-7.07 0L5.52 10.41a5 5 0 0 0 0 7.07" strokeLinecap="round" />
      <path d="M3 3l18 18" strokeLinecap="round" />
    </svg>
  )
}

export function AdminIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" strokeLinecap="round" />
      <path d="M16 11h6M19 8v6" strokeLinecap="round" />
    </svg>
  )
}

export function ShieldCheckIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AlertIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.5 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
    </svg>
  )
}

export function TermsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 5a2 2 0 0 1 2-2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" strokeLinejoin="round" />
      <path d="M14 3v4h4M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  )
}

export function EyeOffIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.5 11.5 0 0 1-1.7 3.1" />
      <path d="M6.1 6.1A11.6 11.6 0 0 0 1 12.5C2.7 16.9 7 20 12 20a9.7 9.7 0 0 0 4.3-1" />
    </svg>
  )
}

export function ServerIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function QuoteIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 7.5a3.5 3.5 0 0 1 3.5 3.5c0 2.5-2 4.5-4.5 4.5V12a2 2 0 1 0 0-4h2V7.5H7Zm9 0a3.5 3.5 0 0 1 3.5 3.5c0 2.5-2 4.5-4.5 4.5V12a2 2 0 1 0 0-4h2V7.5H16Z" />
    </svg>
  )
}

/* ── Shells & helpers ── */

export function IconShell({ children, tint }: { children: ReactNode; tint?: 'signal' | 'discord' | 'fivem' | 'cfx' | 'cloak' }) {
  const tintClass =
    tint === 'discord'
      ? 'border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2]'
      : tint === 'fivem'
        ? 'border-[#F40552]/30 bg-[#F40552]/10 text-[#F40552]'
        : tint === 'cfx'
          ? 'border-[#FF0033]/30 bg-[#FF0033]/10 text-[#FF0033]'
          : tint === 'cloak'
            ? 'border-signal/25 bg-signal/10 text-signal'
            : 'border-signal/25 bg-gradient-to-br from-signal/20 to-signal-dim/10 text-signal'

  return (
    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${tintClass}`}>
      {children}
    </div>
  )
}

export function WorkTileBanner({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <div
      className="relative flex h-40 items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(circle at 30% 30%, ${accent}22, transparent 55%), linear-gradient(135deg, rgba(12,12,14,0.9), rgba(20,20,24,0.95))` }}
    >
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
      <div className="relative flex items-center justify-center">{children}</div>
    </div>
  )
}

export function AvatarBadge({ name, role }: { name: string; role: string }) {
  const initial = name.charAt(0).toUpperCase()
  const roleIcon =
    role.includes('owner') || role.includes('lead') ? (
      <ShieldCheckIcon className="h-3.5 w-3.5" />
    ) : role.includes('Staff') ? (
      <AlertIcon className="h-3.5 w-3.5" />
    ) : (
      <ServerIcon className="h-3.5 w-3.5" />
    )

  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-signal/30 bg-gradient-to-br from-signal/25 to-signal-dim/15 text-sm font-bold text-signal">
        {initial}
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-ink/80 text-signal">
        {roleIcon}
      </div>
    </div>
  )
}

export type OfferVisual =
  | { type: 'brand'; tint: 'fivem' | 'discord' | 'cloak'; Mark: ComponentType<IconProps> }
  | { type: 'icon'; tint?: 'signal'; Icon: ComponentType<IconProps> }

export const offers: { title: string; body: string; visual: OfferVisual }[] = [
  {
    title: 'Private joins',
    body: 'FiveM join links stay inside the desktop app so IPs never land in chat or clipboard.',
    visual: { type: 'brand', tint: 'fivem', Mark: FiveMMark },
  },
  {
    title: 'Discord verified',
    body: 'Desktop login requires Cloak Discord membership. Authorize once, then Cloak remembers you.',
    visual: { type: 'brand', tint: 'discord', Mark: DiscordMark },
  },
  {
    title: 'Admin access',
    body: 'Servers only appear after the respective server admin grants you access.',
    visual: { type: 'icon', Icon: AdminIcon },
  },
  {
    title: 'Leak protection',
    body: 'Reduce accidental or intentional sharing of endpoints, ports, and join URLs.',
    visual: { type: 'icon', Icon: ShieldCheckIcon },
  },
  {
    title: 'Warnings & penalties',
    body: 'See warnings and outstanding penalties from server admins in one place.',
    visual: { type: 'icon', Icon: AlertIcon },
  },
  {
    title: 'Support & terms',
    body: 'In-app support plus clear rules for protected information and responsible use.',
    visual: { type: 'icon', Icon: TermsIcon },
  },
]

export const workTiles: {
  tag: string
  title: string
  body: string
  accent: string
  banner: ComponentType<IconProps>
}[] = [
  {
    tag: 'Desktop',
    title: 'Discord sign-in',
    body: 'Community membership check before home.',
    accent: '#5865F2',
    banner: DiscordMark,
  },
  {
    tag: 'Access',
    title: 'Protected servers',
    body: 'Join only the servers you are granted.',
    accent: '#F40552',
    banner: FiveMMark,
  },
  {
    tag: 'Security',
    title: 'Hidden endpoints',
    body: 'Connection details never hit public chat.',
    accent: '#22C55E',
    banner: EyeOffIcon,
  },
  {
    tag: 'Policy',
    title: 'Terms & penalties',
    body: 'Rules that protect servers and communities.',
    accent: '#22C55E',
    banner: TermsIcon,
  },
]

export const whyPoints = [
  { text: 'FiveM join links stay inside Cloak — not in Discord or DMs.', Icon: FiveMMark, tint: '#F40552' },
  { text: 'Discord membership verifies identity before you reach the app.', Icon: DiscordMark, tint: '#5865F2' },
  { text: 'Admins grant server access — you only see what you are allowed.', Icon: ShieldCheckIcon, tint: '#22C55E' },
] as const
