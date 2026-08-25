export type CloakUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
}

export type AuthResult =
  | { ok: true; user: CloakUser }
  | { ok: false; error: string }

export type CloakApi = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  discordLogin: () => Promise<AuthResult>
  isDiscordConfigured: () => Promise<boolean>
  onAuthResult: (callback: (result: AuthResult) => void) => () => void
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
