import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * Cloak backend schema (Convex) — shared by Cloak Desktop + Cloak Admin.
 *
 * Admin operators and the data they manage are keyed by Discord username
 * so staff can grant access / issue actions by the name people use in Discord.
 * discordId is stored when known (from OAuth) for stable session checks.
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
    /** Which desktop app owns this session — user + admin can stay signed in together. */
    appRole: v.optional(v.union(v.literal('user'), v.literal('admin'))),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_discord_id', ['discordId'])
    .index('by_discord_id_and_role', ['discordId', 'appRole']),

  googleUsers: defineTable({
    googleId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.union(v.string(), v.null()),
    lastLoginAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_google_id', ['googleId'])
    .index('by_email', ['email']),

  googleSessions: defineTable({
    token: v.string(),
    googleId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_google_id', ['googleId']),

  supportIssues: defineTable({
    googleId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    category: v.union(
      v.literal('install'),
      v.literal('discord'),
      v.literal('servers'),
      v.literal('website'),
      v.literal('other'),
    ),
    subject: v.string(),
    description: v.string(),
    discordUsername: v.optional(v.string()),
    preferDiscordSupport: v.boolean(),
    status: v.union(
      v.literal('open'),
      v.literal('in_progress'),
      v.literal('resolved'),
      v.literal('closed'),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_google_id', ['googleId'])
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),

  /**
   * Cloak Admin operators — managed by Discord username.
   * Example: allowlist "realcaps04"; when they sign in, discordId is linked.
   */
  admins: defineTable({
    /** Canonical Discord username (lowercase) — primary key for staff management. */
    discordUsername: v.string(),
    /** Filled/updated on Admin app sign-in when known. */
    discordId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    role: v.union(v.literal('owner'), v.literal('admin')),
    active: v.boolean(),
    createdByDiscordUsername: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_discord_username', ['discordUsername'])
    .index('by_discord_id', ['discordId'])
    .index('by_active', ['active']),

  /** Private FiveM / game servers — endpoints never shown to ungated players. */
  servers: defineTable({
    name: v.string(),
    tagline: v.optional(v.string()),
    joinEndpoint: v.string(),
    region: v.optional(v.string()),
    status: v.union(v.literal('online'), v.literal('maintenance'), v.literal('offline')),
    maxPlayers: v.optional(v.number()),
    /** Registration / verification fields from Add Server form. */
    discordInviteUrl: v.optional(v.string()),
    discordServerId: v.optional(v.string()),
    iconFileName: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    fivemConnectUrl: v.optional(v.string()),
    fivemIpHost: v.optional(v.string()),
    fivemPort: v.optional(v.string()),
    framework: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    ownerDiscordUsername: v.optional(v.string()),
    ownershipConfirmed: v.optional(v.boolean()),
    verificationDocNames: v.optional(v.array(v.string())),
    verificationDocStorageIds: v.optional(v.array(v.id('_storage'))),
    notes: v.optional(v.string()),
    verificationStatus: v.optional(
      v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    ),
    createdByDiscordUsername: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_created_by_username', ['createdByDiscordUsername'])
    .index('by_status', ['status'])
    .index('by_name', ['name'])
    .index('by_verification_status', ['verificationStatus']),

  /**
   * Per-server Sub Admins — Discord usernames who can manage that FiveM server.
   * Server creator is typically the first owner; more sub-admins can be added.
   */
  serverSubAdmins: defineTable({
    serverId: v.id('servers'),
    discordUsername: v.string(),
    discordId: v.optional(v.string()),
    role: v.union(v.literal('owner'), v.literal('sub_admin')),
    status: v.optional(
      v.union(
        v.literal('approved'),
        v.literal('suspended'),
        v.literal('pending'),
        v.literal('rejected'),
      ),
    ),
    addedByDiscordUsername: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index('by_server', ['serverId'])
    .index('by_username', ['discordUsername'])
    .index('by_server_and_username', ['serverId', 'discordUsername']),

  /**
   * Per-server player access (roster) — players are added by Discord username.
   */
  serverAccess: defineTable({
    serverId: v.id('servers'),
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    grantedByDiscordUsername: v.string(),
    note: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('approved'),
        v.literal('suspended'),
        v.literal('pending'),
        v.literal('rejected'),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index('by_server', ['serverId'])
    .index('by_player_username', ['playerDiscordUsername'])
    .index('by_server_and_player_username', ['serverId', 'playerDiscordUsername']),

  /** Warnings issued to players by Discord username. */
  playerWarnings: defineTable({
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    serverId: v.optional(v.id('servers')),
    message: v.string(),
    issuedByDiscordUsername: v.string(),
    status: v.union(v.literal('open'), v.literal('acknowledged'), v.literal('cleared')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_player_username', ['playerDiscordUsername'])
    .index('by_status', ['status'])
    .index('by_server', ['serverId']),

  /** Outstanding penalties / dues — keyed by Discord username. */
  playerPenalties: defineTable({
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    serverId: v.optional(v.id('servers')),
    amount: v.number(),
    currency: v.optional(v.string()),
    reason: v.string(),
    issuedByDiscordUsername: v.string(),
    status: v.union(v.literal('open'), v.literal('paid'), v.literal('waived')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_player_username', ['playerDiscordUsername'])
    .index('by_status', ['status'])
    .index('by_server', ['serverId']),
})
