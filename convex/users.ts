import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const SESSION_DAYS = 30

function makeSessionToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
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
  },
  handler: async (ctx, args) => {
    if (!args.guildVerified) {
      throw new Error('Guild membership is required to create a Cloak session.')
    }

    const now = Date.now()
    const existing = await ctx.db
      .query('users')
      .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
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
        username: args.username,
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

    // Drop older sessions for this user (keep login fresh, one primary session)
    const oldSessions = await ctx.db
      .query('sessions')
      .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId))
      .collect()
    for (const session of oldSessions) {
      await ctx.db.delete(session._id)
    }

    const token = makeSessionToken()
    const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000

    await ctx.db.insert('sessions', {
      token,
      discordId: args.discordId,
      createdAt: now,
      expiresAt,
      lastSeenAt: now,
    })

    return {
      token,
      expiresAt,
      user: {
        id: args.discordId,
        username: args.username,
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
