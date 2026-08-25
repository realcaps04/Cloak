import type { ReactNode } from 'react'
import { CloakMark, CfxMark, DiscordMark, FiveMMark, LinkOffIcon, ShieldCheckIcon } from '@/web/WebsiteIcons'

function LogoMark({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="flex h-10 shrink-0 items-center gap-2.5 text-mist/55 transition-colors hover:text-mist/80"
      aria-label={label}
    >
      {children}
    </div>
  )
}

function Wordmark({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap text-base font-semibold tracking-tight">{children}</span>
}

export function FiveMLogo() {
  return (
    <LogoMark label="FiveM">
      <FiveMMark className="h-7 w-7 text-[#F40552]" />
      <Wordmark>FiveM</Wordmark>
    </LogoMark>
  )
}

export function CfxLogo() {
  return (
    <LogoMark label="Cfx.re">
      <CfxMark className="h-5 w-auto text-[#FF0033]" />
    </LogoMark>
  )
}

export function DiscordLogo() {
  return (
    <LogoMark label="Discord">
      <DiscordMark className="h-7 w-7 text-[#5865F2]" />
      <Wordmark>Discord</Wordmark>
    </LogoMark>
  )
}

export function DesktopLogo() {
  return (
    <LogoMark label="Cloak Desktop">
      <CloakMark className="h-7 w-7" />
      <Wordmark>Cloak Desktop</Wordmark>
    </LogoMark>
  )
}

export function ProtectedRpLogo() {
  return (
    <LogoMark label="Protected RP">
      <ShieldCheckIcon className="h-7 w-7 text-signal" />
      <Wordmark>Protected RP</Wordmark>
    </LogoMark>
  )
}

export function PrivateJoinsLogo() {
  return (
    <LogoMark label="Private joins">
      <LinkOffIcon className="h-7 w-7 text-signal" />
      <Wordmark>Private joins</Wordmark>
    </LogoMark>
  )
}

export const trustedLogos = [
  { id: 'fivem', Logo: FiveMLogo },
  { id: 'cfx', Logo: CfxLogo },
  { id: 'discord', Logo: DiscordLogo },
  { id: 'desktop', Logo: DesktopLogo },
  { id: 'protected-rp', Logo: ProtectedRpLogo },
  { id: 'private-joins', Logo: PrivateJoinsLogo },
] as const
