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

export type DiscordConfigStatus = {
  configured: boolean
  missing: string[]
}

export type JoinResult = { ok: boolean; message: string }

export type UpdateAvailability = {
  update: boolean
  version: string
  newVersion?: string
}

export type UpdateDownloadProgress = {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export type UpdateCheckResult =
  | { updateInfo?: unknown; portable?: boolean }
  | { message: string; error: Error; portable?: boolean }

export type CloakApi = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  discordLogin: () => Promise<AuthResult>
  joinAndVerify: () => Promise<AuthResult>
  restoreSession: () => Promise<AuthResult | { ok: false }>
  logout: () => Promise<{ ok: boolean }>
  isDiscordConfigured: () => Promise<boolean>
  getDiscordConfigStatus: () => Promise<DiscordConfigStatus>
  getDiscordCommunity: () => Promise<DiscordCommunity>
  openDiscordInvite: () => Promise<void>
  cancelDiscordAuth: () => Promise<{ ok: boolean }>
  onAuthResult: (callback: (result: AuthResult) => void) => () => void
  onMembershipWaiting: (callback: (payload: MembershipWaitingPayload) => void) => () => void
  joinServer: (serverId: string) => Promise<JoinResult>
  getAppVersion?: () => Promise<string>
  getUpdateRuntimeInfo?: () => Promise<{ packaged: boolean; portable: boolean; version: string }>
  checkForUpdates?: () => Promise<UpdateCheckResult>
  startUpdateDownload?: () => Promise<void | { ok: boolean; message?: string }>
  cancelUpdateDownload?: () => Promise<void | { ok: boolean }>
  quitAndInstall?: () => Promise<void | { ok: boolean; portable?: boolean }>
  onUpdateAvailable?: (callback: (info: UpdateAvailability) => void) => () => void
  onDownloadProgress?: (callback: (info: UpdateDownloadProgress) => void) => () => void
  onUpdateDownloaded?: (callback: () => void) => () => void
  onUpdateError?: (callback: (info: { message: string }) => void) => () => void
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
