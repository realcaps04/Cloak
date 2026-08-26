import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const SESSION_DAYS = 30

const appRoleValidator = v.optional(v.union(v.literal('user'), v.literal('admin')))

/** Discord usernames are matched case-insensitively (same as admin roster). */
function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, '').toLowerCase()
}

function makeSessionToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function resolveAppRole(appRole: 'user' | 'admin' | undefined): 'user' | 'admin' {
  return appRole === 'admin' ? 'admin' : 'user'
}

/**
 * Upsert Discord user + create a long-lived session.
 * Called from Cloak Electron after Discord membership is verified.
 */
export const upsertAndCreateSession = mutation({
  args: {
    discordId: v.string(),
    username: v.string(),
    globalName: v.union(v.string(), v.null()),
    avatar: v.union(v.string(), v.null()),
    discriminator: v.string(),
    guildVerified: v.boolean(),
    guildId: v.optional(v.string()),
    guildName: v.optional(v.string()),
    appRole: appRoleValidator,
  },
  handler: async (ctx, args) => {
    if (!args.guildVerified) {
      throw new Error('Guild membership is required to create a Cloak session.')
    }

    const now = Date.now()
    const role = resolveAppRole(args.appRole)
    const username = normalizeUsername(args.username)
    if (!username) throw new Error('Discord username is required.')

    const existing = await ctx.db
      .query('users')
      .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        username,
        globalName: args.globalName,
        avatar: args.avatar,
        discriminator: args.discriminator,
        guildVerified: args.guildVerified,
        guildId: args.guildId,
        guildName: args.guildName,
        lastLoginAt: now,
      })
    } else {
      await ctx.db.insert('users', {
        discordId: args.discordId,
        username,
        globalName: args.globalName,
        avatar: args.avatar,
        discriminator: args.discriminator,
        guildVerified: args.guildVerified,
        guildId: args.guildId,
        guildName: args.guildName,
        lastLoginAt: now,
        createdAt: now,
      })
    }

    // Attach Discord id onto roster grants that match this username so later lookups stay stable.
    const grants = await ctx.db
      .query('serverAccess')
      .withIndex('by_player_username', (q) => q.eq('playerDiscordUsername', username))
      .collect()
    for (const grant of grants) {
      if (grant.playerDiscordId !== args.discordId) {
        await ctx.db.patch(grant._id, {
          playerDiscordId: args.discordId,
          updatedAt: now,
        })
      }
    }

    // Only replace sessions for this app role so User + Admin can stay signed in together.
    const oldSessions = await ctx.db
      .query('sessions')
      .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId))
      .collect()
    for (const session of oldSessions) {
      const sessionRole = resolveAppRole(session.appRole)
      if (sessionRole === role) {
        await ctx.db.delete(session._id)
      }
    }

    const token = makeSessionToken()
    const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000

    await ctx.db.insert('sessions', {
      token,
      discordId: args.discordId,
      appRole: role,
      createdAt: now,
      expiresAt,
      lastSeenAt: now,
    })

    return {
      token,
      expiresAt,
      user: {
        id: args.discordId,
        username,
        globalName: args.globalName,
        avatar: args.avatar,
        discriminator: args.discriminator,
        guildVerified: args.guildVerified,
        guildId: args.guildId,
        guildName: args.guildName,
      },
    }
  },
})

/**
 * Restore a desktop session without Discord OAuth.
 */
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()

    if (!session) return null
    if (session.expiresAt < Date.now()) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_discord_id', (q) => q.eq('discordId', session.discordId))
      .unique()

    if (!user || !user.guildVerified) return null

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.discordId,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
        discriminator: user.discriminator,
        guildVerified: user.guildVerified,
        guildId: user.guildId,
        guildName: user.guildName,
      },
    }
  },
})

/**
 * Touch session lastSeenAt when the app opens successfully.
 */
export const touchSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()

    if (!session) return { ok: false as const }
    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id)
      return { ok: false as const }
    }

    await ctx.db.patch(session._id, { lastSeenAt: Date.now() })
    return { ok: true as const }
  },
})

/**
 * Sign out — delete session row in Convex.
 */
export const revokeSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()

    if (session) {
      await ctx.db.delete(session._id)
    }

    return { ok: true as const }
  },
})

export const getUserByDiscordId = query({
  args: { discordId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId))
      .unique()
  },
})
