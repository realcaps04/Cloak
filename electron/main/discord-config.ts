import { getDefaultRedirectUri, isAdminApp } from './app-role'

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
  if (isAdminApp()) {
    return env('DISCORD_ADMIN_REDIRECT_URI') || getDefaultRedirectUri()
  }
  return env('DISCORD_REDIRECT_URI') || getDefaultRedirectUri()
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

export function getDiscordConfigStatus() {
  const missing: string[] = []
  if (!getDiscordClientId()) missing.push('DISCORD_CLIENT_ID')
  if (!getDiscordClientSecret()) missing.push('DISCORD_CLIENT_SECRET')
  if (!getDiscordGuildId()) missing.push('DISCORD_GUILD_ID')
  return { configured: missing.length === 0, missing }
}

export function getDiscordCommunity() {
  return {
    guildId: getDiscordGuildId(),
    guildName: getDiscordGuildName(),
    inviteUrl: getDiscordInviteUrl(),
  }
}
