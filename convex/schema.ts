import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * Cloak backend schema (Convex).
 * users  — Discord-verified members
 * sessions — persistent login so the desktop app skips Discord on reopen
 */
export default defineSchema({
  users: defineTable({
    discordId: v.string(),
    username: v.string(),
    globalName: v.union(v.string(), v.null()),
    avatar: v.union(v.string(), v.null()),
    discriminator: v.string(),
    guildVerified: v.boolean(),
    guildId: v.optional(v.string()),
    guildName: v.optional(v.string()),
    lastLoginAt: v.number(),
    createdAt: v.number(),
  }).index('by_discord_id', ['discordId']),

  sessions: defineTable({
    token: v.string(),
    discordId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_discord_id', ['discordId']),
})
