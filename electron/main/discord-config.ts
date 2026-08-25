function env(key: string, fallback = '') {
  return (process.env[key] ?? fallback).trim()
}

export function getDiscordInviteUrl() {
  return env('DISCORD_INVITE_URL', 'https://discord.gg/2KmAr9TUU')
}

export function getDiscordGuildId() {
  return env('DISCORD_GUILD_ID')
}

export function getDiscordGuildName() {
  return env('DISCORD_GUILD_NAME', 'Cloak Community')
}

export function getDiscordRedirectUri() {
  return env('DISCORD_REDIRECT_URI', 'http://127.0.0.1:19283/callback')
}

export function getDiscordClientId() {
  return env('DISCORD_CLIENT_ID')
}

export function getDiscordClientSecret() {
  return env('DISCORD_CLIENT_SECRET')
}

export function isDiscordAuthConfigured() {
  return Boolean(getDiscordClientId() && getDiscordClientSecret() && getDiscordGuildId())
}

export function getDiscordCommunity() {
  return {
    guildId: getDiscordGuildId(),
    guildName: getDiscordGuildName(),
    inviteUrl: getDiscordInviteUrl(),
  }
}
