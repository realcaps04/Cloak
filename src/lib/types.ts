export type CloakUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
  guildVerified?: boolean
  guildId?: string
  guildName?: string
}

export type AuthErrorCode =
  | 'NOT_CONFIGURED'
  | 'NOT_IN_GUILD'
  | 'CANCELLED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN'

export type AuthResult =
  | { ok: true; user: CloakUser }
  | { ok: false; error: string; code?: AuthErrorCode; inviteUrl?: string }

export type MembershipWaitingPayload = {
  message: string
  guildName: string
  inviteUrl: string
}

export type DiscordCommunity = {
  guildId: string
  guildName: string
  inviteUrl: string
}

export type JoinResult = { ok: boolean; message: string }

export type CloakApi = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  discordLogin: () => Promise<AuthResult>
  joinAndVerify: () => Promise<AuthResult>
  restoreSession: () => Promise<AuthResult | { ok: false }>
  logout: () => Promise<{ ok: boolean }>
  isDiscordConfigured: () => Promise<boolean>
  getDiscordCommunity: () => Promise<DiscordCommunity>
  openDiscordInvite: () => Promise<void>
  onAuthResult: (callback: (result: AuthResult) => void) => () => void
  onMembershipWaiting: (callback: (payload: MembershipWaitingPayload) => void) => () => void
  joinServer: (serverId: string) => Promise<JoinResult>
}

declare global {
  interface Window {
    cloak?: CloakApi
  }
}

export function avatarUrl(user: CloakUser, size = 128) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`
  }
  return `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`
}

export function displayName(user: CloakUser) {
  return user.globalName || user.username
}
