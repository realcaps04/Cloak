import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import type { CloakUser } from './discord-auth'

const upsertAndCreateSession = makeFunctionReference<
  'mutation',
  {
    discordId: string
    username: string
    globalName: string | null
    avatar: string | null
    discriminator: string
    guildVerified: boolean
    guildId?: string
    guildName?: string
  },
  {
    token: string
    expiresAt: number
    user: {
      id: string
      username: string
      globalName: string | null
      avatar: string | null
      discriminator: string
      guildVerified: boolean
      guildId?: string
      guildName?: string
    }
  }
>('users:upsertAndCreateSession')

const getSession = makeFunctionReference<
  'query',
  { token: string },
  {
    token: string
    expiresAt: number
    user: {
      id: string
      username: string
      globalName: string | null
      avatar: string | null
      discriminator: string
      guildVerified: boolean
      guildId?: string
      guildName?: string
    }
  } | null
>('users:getSession')

const touchSession = makeFunctionReference<'mutation', { token: string }, { ok: boolean }>(
  'users:touchSession',
)

const revokeSession = makeFunctionReference<'mutation', { token: string }, { ok: boolean }>(
  'users:revokeSession',
)

function getConvexUrl() {
  return (
    process.env.CONVEX_URL?.trim() ||
    process.env.VITE_CONVEX_URL?.trim() ||
    'https://sleek-shark-313.convex.cloud'
  )
}

export function isConvexConfigured() {
  return Boolean(getConvexUrl())
}

function client() {
  return new ConvexHttpClient(getConvexUrl())
}

export type PersistedSession = {
  token: string
  expiresAt: number
  user: CloakUser
}

function mapUser(user: {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
  guildVerified: boolean
  guildId?: string
  guildName?: string
}): CloakUser {
  return {
    id: user.id,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    discriminator: user.discriminator,
    guildVerified: user.guildVerified,
    guildId: user.guildId,
    guildName: user.guildName,
  }
}

/** Save Discord user to Convex and create a 30-day session. */
export async function saveUserSession(user: CloakUser): Promise<PersistedSession> {
  const result = await client().mutation(upsertAndCreateSession, {
    discordId: user.id,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    discriminator: user.discriminator,
    guildVerified: user.guildVerified,
    guildId: user.guildId,
    guildName: user.guildName,
  })

  return {
    token: result.token,
    expiresAt: result.expiresAt,
    user: mapUser(result.user),
  }
}

/** Restore session from Convex by token (no Discord login). */
export async function restoreUserSession(token: string): Promise<PersistedSession | null> {
  const result = await client().query(getSession, { token })
  if (!result) return null

  await client().mutation(touchSession, { token })

  return {
    token: result.token,
    expiresAt: result.expiresAt,
    user: mapUser(result.user),
  }
}

export async function revokeUserSession(token: string) {
  await client().mutation(revokeSession, { token })
}
