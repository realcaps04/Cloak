import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { buildEmojiPoisonServers } from './emojiPoison'

const adminRole = v.union(v.literal('owner'), v.literal('admin'))
const serverStatus = v.union(v.literal('online'), v.literal('maintenance'), v.literal('offline'))
const warningStatus = v.union(v.literal('open'), v.literal('acknowledged'), v.literal('cleared'))
const penaltyStatus = v.union(v.literal('open'), v.literal('paid'), v.literal('waived'))
const rosterMemberStatus = v.union(
  v.literal('approved'),
  v.literal('suspended'),
  v.literal('pending'),
  v.literal('rejected'),
)

/** Discord usernames are matched case-insensitively. */
function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, '').toLowerCase()
}

async function userByDiscordId(ctx: QueryCtx | MutationCtx, discordId: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_discord_id', (q) => q.eq('discordId', discordId))
    .unique()
}

async function adminByUsername(ctx: QueryCtx | MutationCtx, username: string) {
  const discordUsername = normalizeUsername(username)
  if (!discordUsername) return null
  return await ctx.db
    .query('admins')
    .withIndex('by_discord_username', (q) => q.eq('discordUsername', discordUsername))
    .unique()
}

/**
 * Resolve the signed-in admin from session → Discord user → username allowlist.
 * Also links discordId onto the admin row when missing.
 */
async function adminFromSession(ctx: MutationCtx | QueryCtx, sessionToken: string) {
  const token = sessionToken.trim()
  if (!token) throw new Error('Session token is required.')

  const session = await ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', token))
    .unique()
  if (!session || session.expiresAt < Date.now()) {
    throw new Error('Admin session expired. Sign in again.')
  }
  if (session.appRole !== 'admin') {
    throw new Error('Admin session required.')
  }

  const user = await userByDiscordId(ctx, session.discordId)
  if (!user) throw new Error('Discord user not found for this session.')

  const username = normalizeUsername(user.username)
  let admin = await adminByUsername(ctx, username)

  // Also allow match if admin row was linked by discordId earlier under a renamed user.
  if (!admin) {
    admin = await ctx.db
      .query('admins')
      .withIndex('by_discord_id', (q) => q.eq('discordId', session.discordId))
      .unique()
  }

  const allAdmins = await ctx.db.query('admins').collect()
  if (!admin && allAdmins.length === 0) {
    // Bootstrap: first signed-in Admin becomes owner under their Discord username.
    return {
      discordUsername: username,
      discordId: session.discordId,
      displayName: user.globalName ?? user.username,
      role: 'owner' as const,
      active: true,
      bootstrap: true as const,
    }
  }

  if (!admin || !admin.active) {
    throw new Error(
      `Discord username @${user.username} is not on the Cloak Admin allowlist.`,
    )
  }

  return {
    ...admin,
    discordUsername: admin.discordUsername,
    discordId: session.discordId,
    bootstrap: false as const,
  }
}

async function ensureAdminLinked(
  ctx: MutationCtx,
  sessionToken: string,
): Promise<{ discordUsername: string; discordId: string }> {
  const resolved = await adminFromSession(ctx, sessionToken)
  const now = Date.now()

  if (resolved.bootstrap) {
    await ctx.db.insert('admins', {
      discordUsername: resolved.discordUsername,
      discordId: resolved.discordId,
      displayName: resolved.displayName ?? undefined,
      role: 'owner',
      active: true,
      createdByDiscordUsername: resolved.discordUsername,
      createdAt: now,
      updatedAt: now,
    })
    return { discordUsername: resolved.discordUsername, discordId: resolved.discordId }
  }

  const row = await adminByUsername(ctx, resolved.discordUsername)
  if (row && row.discordId !== resolved.discordId) {
    await ctx.db.patch(row._id, {
      discordId: resolved.discordId,
      updatedAt: now,
    })
  }

  return { discordUsername: resolved.discordUsername, discordId: resolved.discordId }
}

/** Check allowlist by Discord username (preferred) or id. */
export const isAdminOperator = query({
  args: {
    discordUsername: v.optional(v.string()),
    discordId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.db.query('admins').collect()
    if (admins.length === 0) {
      return { allowed: true, bootstrap: true }
    }

    if (args.discordUsername) {
      const row = await adminByUsername(ctx, args.discordUsername)
      if (row?.active) {
        return { allowed: true, bootstrap: false, role: row.role, discordUsername: row.discordUsername }
      }
    }

    if (args.discordId) {
      const byId = await ctx.db
        .query('admins')
        .withIndex('by_discord_id', (q) => q.eq('discordId', args.discordId!))
        .unique()
      if (byId?.active) {
        return {
          allowed: true,
          bootstrap: false,
          role: byId.role,
          discordUsername: byId.discordUsername,
        }
      }
    }

    return { allowed: false, bootstrap: false }
  },
})

export const listAdmins = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    const rows = await ctx.db.query('admins').collect()
    return rows.sort((a, b) => a.discordUsername.localeCompare(b.discordUsername))
  },
})

/**
 * Add / update an admin by Discord username (how staff manage operators).
 * First username in an empty table becomes owner.
 */
export const upsertAdmin = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    discordUsername: v.string(),
    discordId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    role: v.optional(adminRole),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const discordUsername = normalizeUsername(args.discordUsername)
    if (!discordUsername) throw new Error('Discord username is required.')

    const existingAdmins = await ctx.db.query('admins').collect()
    const now = Date.now()

    let actorUsername: string
    if (existingAdmins.length === 0) {
      actorUsername = discordUsername
    } else if (args.sessionToken) {
      const actor = await ensureAdminLinked(ctx, args.sessionToken)
      actorUsername = actor.discordUsername
    } else {
      throw new Error('Admin session required to manage operators.')
    }

    const existing = await adminByUsername(ctx, discordUsername)
    const role = args.role ?? (existingAdmins.length === 0 ? 'owner' : 'admin')
    const active = args.active ?? true

    if (existing) {
      await ctx.db.patch(existing._id, {
        discordId: args.discordId ?? existing.discordId,
        displayName: args.displayName ?? existing.displayName,
        role,
        active,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('admins', {
      discordUsername,
      discordId: args.discordId,
      displayName: args.displayName,
      role,
      active,
      createdByDiscordUsername: actorUsername,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/** After Admin Discord login — link this username/id on the allowlist (or bootstrap owner). */
export const linkAdminSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    return await ensureAdminLinked(ctx, args.sessionToken)
  },
})

export const overviewCounts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    const [servers, access, warnings, penalties] = await Promise.all([
      ctx.db.query('servers').collect(),
      ctx.db.query('serverAccess').collect(),
      ctx.db.query('playerWarnings').collect(),
      ctx.db.query('playerPenalties').collect(),
    ])
    return {
      servers: servers.length,
      accessGrants: access.filter((r) => !r.revokedAt).length,
      openWarnings: warnings.filter((w) => w.status === 'open').length,
      openPenalties: penalties.filter((p) => p.status === 'open').length,
    }
  },
})

export const listServers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    const rows = await ctx.db.query('servers').collect()
    const sorted = rows.sort((a, b) => b.updatedAt - a.updatedAt)
    return await Promise.all(
      sorted.map(async (row) => ({
        ...row,
        iconUrl: row.iconStorageId ? await ctx.storage.getUrl(row.iconStorageId) : null,
      })),
    )
  },
})

export const generateIconUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    return await ctx.storage.generateUploadUrl()
  },
})

export const upsertServer = mutation({
  args: {
    sessionToken: v.string(),
    serverId: v.optional(v.id('servers')),
    name: v.string(),
    tagline: v.optional(v.string()),
    joinEndpoint: v.string(),
    region: v.optional(v.string()),
    status: serverStatus,
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const name = args.name.trim()
    const joinEndpoint = args.joinEndpoint.trim()
    if (!name) throw new Error('Server name is required.')
    if (!joinEndpoint) throw new Error('Join endpoint is required.')

    const now = Date.now()
    if (args.serverId) {
      const row = await ctx.db.get(args.serverId)
      if (!row) throw new Error('Server not found.')
      await ctx.db.patch(args.serverId, {
        name,
        tagline: args.tagline?.trim() || undefined,
        joinEndpoint,
        region: args.region?.trim() || undefined,
        status: args.status,
        maxPlayers: args.maxPlayers,
        updatedAt: now,
      })
      return args.serverId
    }

    const serverId = await ctx.db.insert('servers', {
      name,
      tagline: args.tagline?.trim() || undefined,
      joinEndpoint,
      region: args.region?.trim() || undefined,
      status: args.status,
      maxPlayers: args.maxPlayers,
      createdByDiscordUsername: actor.discordUsername,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('serverSubAdmins', {
      serverId,
      discordUsername: actor.discordUsername,
      discordId: actor.discordId,
      role: 'owner',
      status: 'approved',
      addedByDiscordUsername: actor.discordUsername,
      createdAt: now,
      updatedAt: now,
    })

    return serverId
  },
})

function buildJoinEndpoint(connectUrl: string, ipHost: string, port: string) {
  const connect = connectUrl.trim()
  if (connect) return connect
  const host = ipHost.trim()
  if (!host) return ''
  if (host.includes(':')) return host
  const p = port.trim() || '30120'
  return `${host}:${p}`
}

/** Full Add Server form → create or update a `servers` row. */
export const submitServerRegistration = mutation({
  args: {
    sessionToken: v.string(),
    serverId: v.optional(v.id('servers')),
    name: v.string(),
    tagline: v.optional(v.string()),
    discordInviteUrl: v.string(),
    discordServerId: v.optional(v.string()),
    iconFileName: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    fivemConnectUrl: v.optional(v.string()),
    fivemIpHost: v.optional(v.string()),
    fivemPort: v.optional(v.string()),
    region: v.string(),
    status: serverStatus,
    maxPlayers: v.optional(v.number()),
    framework: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    ownerDiscordUsername: v.string(),
    ownershipConfirmed: v.boolean(),
    verificationDocNames: v.array(v.string()),
    verificationDocStorageIds: v.optional(v.array(v.id('_storage'))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const name = args.name.trim()
    const discordInviteUrl = args.discordInviteUrl.trim()
    const region = args.region.trim()
    const ownerDiscordUsername = normalizeUsername(args.ownerDiscordUsername)
    const joinEndpoint = buildJoinEndpoint(
      args.fivemConnectUrl ?? '',
      args.fivemIpHost ?? '',
      args.fivemPort ?? '',
    )

    if (!name) throw new Error('Server name is required.')
    if (!discordInviteUrl) throw new Error('Discord invite / server link is required.')
    if (!joinEndpoint) throw new Error('Add a FiveM connect link or IP address.')
    if (!region) throw new Error('Region is required.')
    if (!ownerDiscordUsername) throw new Error('Owner Discord username is required.')
    if (!args.ownershipConfirmed) throw new Error('Ownership confirmation is required.')
    if (args.verificationDocNames.length === 0) {
      throw new Error('Upload at least one ownership verification document.')
    }

    const now = Date.now()
    const docStorageIds = args.verificationDocStorageIds ?? []
    const registrationFields = {
      name,
      tagline: args.tagline?.trim() || undefined,
      joinEndpoint,
      region,
      status: args.status,
      maxPlayers: args.maxPlayers,
      discordInviteUrl,
      discordServerId: args.discordServerId?.trim() || undefined,
      iconFileName: args.iconFileName?.trim() || undefined,
      fivemConnectUrl: args.fivemConnectUrl?.trim() || undefined,
      fivemIpHost: args.fivemIpHost?.trim() || undefined,
      fivemPort: args.fivemPort?.trim() || undefined,
      framework: args.framework?.trim() || undefined,
      websiteUrl: args.websiteUrl?.trim() || undefined,
      ownerDiscordUsername,
      ownershipConfirmed: true,
      verificationDocNames: args.verificationDocNames,
      verificationDocStorageIds: docStorageIds.length > 0 ? docStorageIds : undefined,
      notes: args.notes?.trim() || undefined,
      updatedAt: now,
    }

    if (args.serverId) {
      const existing = await ctx.db.get(args.serverId)
      if (!existing) throw new Error('Server not found.')
      if (args.iconStorageId && existing.iconStorageId && args.iconStorageId !== existing.iconStorageId) {
        await ctx.storage.delete(existing.iconStorageId)
      }
      const prevDocIds = existing.verificationDocStorageIds ?? []
      const nextDocIds = new Set(docStorageIds)
      for (const oldId of prevDocIds) {
        if (!nextDocIds.has(oldId)) {
          await ctx.storage.delete(oldId)
        }
      }
      await ctx.db.patch(args.serverId, {
        ...registrationFields,
        iconStorageId: args.iconStorageId ?? existing.iconStorageId,
        verificationStatus: existing.verificationStatus ?? 'pending',
      })
      return args.serverId
    }

    const serverId = await ctx.db.insert('servers', {
      ...registrationFields,
      iconStorageId: args.iconStorageId,
      verificationStatus: 'pending',
      createdByDiscordUsername: actor.discordUsername,
      createdAt: now,
    })

    await ctx.db.insert('serverSubAdmins', {
      serverId,
      discordUsername: actor.discordUsername,
      discordId: actor.discordId,
      role: 'owner',
      status: 'approved',
      addedByDiscordUsername: actor.discordUsername,
      createdAt: now,
      updatedAt: now,
    })

    return serverId
  },
})

export const deleteServer = mutation({
  args: { sessionToken: v.string(), serverId: v.id('servers') },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.serverId)
    if (!row) return

    const grants = await ctx.db
      .query('serverAccess')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .collect()
    for (const g of grants) await ctx.db.delete(g._id)

    const subs = await ctx.db
      .query('serverSubAdmins')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .collect()
    for (const s of subs) await ctx.db.delete(s._id)

    await ctx.db.delete(args.serverId)
  },
})

export const listSubAdmins = query({
  args: {
    sessionToken: v.string(),
    serverId: v.optional(v.id('servers')),
  },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    if (args.serverId) {
      return await ctx.db
        .query('serverSubAdmins')
        .withIndex('by_server', (q) => q.eq('serverId', args.serverId!))
        .collect()
    }
    return await ctx.db.query('serverSubAdmins').collect()
  },
})

/** Add a Sub Admin (Discord username) for a specific FiveM server. */
export const addSubAdmin = mutation({
  args: {
    sessionToken: v.string(),
    serverId: v.id('servers'),
    discordUsername: v.string(),
    discordId: v.optional(v.string()),
    role: v.optional(v.union(v.literal('owner'), v.literal('sub_admin'))),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const server = await ctx.db.get(args.serverId)
    if (!server) throw new Error('Server not found.')

    const discordUsername = normalizeUsername(args.discordUsername)
    if (!discordUsername) throw new Error('Discord username is required.')

    const existing = await ctx.db
      .query('serverSubAdmins')
      .withIndex('by_server_and_username', (q) =>
        q.eq('serverId', args.serverId).eq('discordUsername', discordUsername),
      )
      .unique()

    const now = Date.now()
    const role = args.role ?? 'sub_admin'

    if (existing) {
      await ctx.db.patch(existing._id, {
        discordId: args.discordId ?? existing.discordId,
        role,
        status: 'approved',
        addedByDiscordUsername: actor.discordUsername,
        revokedAt: undefined,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('serverSubAdmins', {
      serverId: args.serverId,
      discordUsername,
      discordId: args.discordId,
      role,
      status: 'approved',
      addedByDiscordUsername: actor.discordUsername,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const revokeSubAdmin = mutation({
  args: { sessionToken: v.string(), subAdminId: v.id('serverSubAdmins') },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.subAdminId)
    if (!row) return
    if (row.role === 'owner') {
      throw new Error('Cannot revoke the server owner from Sub Admins. Delete the server instead.')
    }
    await ctx.db.patch(args.subAdminId, { revokedAt: Date.now(), updatedAt: Date.now() })
  },
})

export const updateSubAdminStatus = mutation({
  args: {
    sessionToken: v.string(),
    subAdminId: v.id('serverSubAdmins'),
    status: rosterMemberStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.subAdminId)
    if (!row) throw new Error('Staff member not found.')
    // Owners stay approved so server control / data access cannot be locked out.
    if (row.role === 'owner') {
      if (args.status !== 'approved') {
        throw new Error('Owner status is always approved and cannot be changed.')
      }
      await ctx.db.patch(args.subAdminId, {
        status: 'approved',
        updatedAt: Date.now(),
        revokedAt: undefined,
      })
      return
    }
    await ctx.db.patch(args.subAdminId, {
      status: args.status,
      updatedAt: Date.now(),
      revokedAt: args.status === 'rejected' ? Date.now() : undefined,
    })
  },
})

/** Edit a staff roster row (username, server, status). Owners stay approved. */
export const updateSubAdmin = mutation({
  args: {
    sessionToken: v.string(),
    subAdminId: v.id('serverSubAdmins'),
    serverId: v.id('servers'),
    discordUsername: v.string(),
    status: rosterMemberStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.subAdminId)
    if (!row) throw new Error('Staff member not found.')

    const server = await ctx.db.get(args.serverId)
    if (!server) throw new Error('Server not found.')

    const discordUsername = normalizeUsername(args.discordUsername)
    if (!discordUsername) throw new Error('Discord username is required.')

    if (row.role === 'owner' && args.serverId !== row.serverId) {
      throw new Error('Cannot move the server owner to another server. Delete the server instead.')
    }
    if (row.role === 'owner' && args.status !== 'approved') {
      throw new Error('Owner status is always approved and cannot be changed.')
    }

    const clash = await ctx.db
      .query('serverSubAdmins')
      .withIndex('by_server_and_username', (q) =>
        q.eq('serverId', args.serverId).eq('discordUsername', discordUsername),
      )
      .unique()
    if (clash && clash._id !== args.subAdminId) {
      throw new Error(`@${discordUsername} is already staff on this server.`)
    }

    const now = Date.now()
    const status = row.role === 'owner' ? 'approved' : args.status
    await ctx.db.patch(args.subAdminId, {
      serverId: args.serverId,
      discordUsername,
      status,
      updatedAt: now,
      revokedAt: status === 'rejected' ? now : undefined,
    })
  },
})

export const deleteSubAdmin = mutation({
  args: { sessionToken: v.string(), subAdminId: v.id('serverSubAdmins') },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.subAdminId)
    if (!row) return
    if (row.role === 'owner') {
      throw new Error('Cannot delete the server owner. Delete the server instead.')
    }
    await ctx.db.delete(args.subAdminId)
  },
})

export const listAccess = query({
  args: {
    sessionToken: v.string(),
    serverId: v.optional(v.id('servers')),
  },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    if (args.serverId) {
      return await ctx.db
        .query('serverAccess')
        .withIndex('by_server', (q) => q.eq('serverId', args.serverId as Id<'servers'>))
        .collect()
    }
    return await ctx.db.query('serverAccess').collect()
  },
})

/** Grant server access to a player Discord username. */
export const grantAccess = mutation({
  args: {
    sessionToken: v.string(),
    serverId: v.id('servers'),
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const server = await ctx.db.get(args.serverId)
    if (!server) throw new Error('Server not found.')

    const playerDiscordUsername = normalizeUsername(args.playerDiscordUsername)
    if (!playerDiscordUsername) throw new Error('Player Discord username is required.')

    // If this Discord username already has a Cloak Desktop account, store the stable id.
    let playerDiscordId = args.playerDiscordId
    if (!playerDiscordId) {
      const knownUser = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', playerDiscordUsername))
        .unique()
      if (knownUser) playerDiscordId = knownUser.discordId
    }

    const existing = await ctx.db
      .query('serverAccess')
      .withIndex('by_server_and_player_username', (q) =>
        q.eq('serverId', args.serverId).eq('playerDiscordUsername', playerDiscordUsername),
      )
      .unique()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        playerDiscordId: playerDiscordId ?? existing.playerDiscordId,
        note: args.note ?? existing.note,
        grantedByDiscordUsername: actor.discordUsername,
        status: 'approved',
        revokedAt: undefined,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('serverAccess', {
      serverId: args.serverId,
      playerDiscordUsername,
      playerDiscordId,
      grantedByDiscordUsername: actor.discordUsername,
      note: args.note,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const revokeAccess = mutation({
  args: { sessionToken: v.string(), accessId: v.id('serverAccess') },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.accessId)
    if (!row) return
    await ctx.db.patch(args.accessId, { revokedAt: Date.now(), updatedAt: Date.now() })
  },
})

export const updateAccessStatus = mutation({
  args: {
    sessionToken: v.string(),
    accessId: v.id('serverAccess'),
    status: rosterMemberStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.accessId)
    if (!row) throw new Error('Roster entry not found.')
    await ctx.db.patch(args.accessId, {
      status: args.status,
      updatedAt: Date.now(),
      revokedAt: args.status === 'rejected' ? Date.now() : undefined,
    })
  },
})

/** Edit a player roster row (username, server, note, status). */
export const updateAccess = mutation({
  args: {
    sessionToken: v.string(),
    accessId: v.id('serverAccess'),
    serverId: v.id('servers'),
    playerDiscordUsername: v.string(),
    note: v.optional(v.string()),
    status: rosterMemberStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.accessId)
    if (!row) throw new Error('Roster entry not found.')

    const server = await ctx.db.get(args.serverId)
    if (!server) throw new Error('Server not found.')

    const playerDiscordUsername = normalizeUsername(args.playerDiscordUsername)
    if (!playerDiscordUsername) throw new Error('Player Discord username is required.')

    const clash = await ctx.db
      .query('serverAccess')
      .withIndex('by_server_and_player_username', (q) =>
        q.eq('serverId', args.serverId).eq('playerDiscordUsername', playerDiscordUsername),
      )
      .unique()
    if (clash && clash._id !== args.accessId) {
      throw new Error(`@${playerDiscordUsername} is already on this server roster.`)
    }

    let playerDiscordId = row.playerDiscordId
    if (playerDiscordUsername !== row.playerDiscordUsername) {
      const knownUser = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', playerDiscordUsername))
        .unique()
      playerDiscordId = knownUser?.discordId
    }

    const now = Date.now()
    await ctx.db.patch(args.accessId, {
      serverId: args.serverId,
      playerDiscordUsername,
      playerDiscordId,
      note: args.note?.trim() || undefined,
      status: args.status,
      updatedAt: now,
      revokedAt: args.status === 'rejected' ? now : undefined,
    })
  },
})

export const deleteAccess = mutation({
  args: { sessionToken: v.string(), accessId: v.id('serverAccess') },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.accessId)
    if (!row) return
    await ctx.db.delete(args.accessId)
  },
})

export const listWarnings = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const admin = await adminFromSession(ctx, args.sessionToken)
    const username = normalizeUsername(admin.discordUsername)
    const staffRows = await ctx.db
      .query('serverSubAdmins')
      .withIndex('by_username', (q) => q.eq('discordUsername', username))
      .collect()
    const serverIds = new Set(
      staffRows.filter((row) => !row.revokedAt).map((row) => row.serverId),
    )

    const rows = await ctx.db.query('playerWarnings').collect()
    return rows
      .filter((row) => !row.serverId || serverIds.has(row.serverId))
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

/**
 * Player Desktop auto-report: F8 / copy attempts → open warnings for each
 * server the player is approved on (visible to those servers' admins).
 */
export const reportDesktopSecurityEvent = mutation({
  args: {
    sessionToken: v.string(),
    keyPressed: v.optional(v.string()),
    copiedText: v.optional(v.string()),
    eventType: v.union(v.literal('f8'), v.literal('copy')),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .unique()
    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Session expired. Sign in again.')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_discord_id', (q) => q.eq('discordId', session.discordId))
      .unique()
    if (!user || !user.guildVerified) {
      throw new Error('Not signed in.')
    }

    const playerDiscordUsername = normalizeUsername(user.username)
    const now = Date.now()

    let grants = await ctx.db
      .query('serverAccess')
      .withIndex('by_player_username', (q) =>
        q.eq('playerDiscordUsername', playerDiscordUsername),
      )
      .collect()

    if (grants.length === 0) {
      const byId = await ctx.db
        .query('serverAccess')
        .withIndex('by_player_discord_id', (q) => q.eq('playerDiscordId', user.discordId))
        .collect()
      grants = byId
    }

    const activeServerIds = [
      ...new Set(
        grants
          .filter((g) => !g.revokedAt && (g.status ?? 'approved') === 'approved')
          .map((g) => g.serverId),
      ),
    ]

    const copied = (args.copiedText ?? '').trim().slice(0, 500)
    const key = (args.keyPressed ?? '').trim() || (args.eventType === 'f8' ? 'F8' : 'Copy')
    const messageParts = [
      `Cloak Desktop security alert for @${playerDiscordUsername}.`,
      `Key pressed: ${key}.`,
      copied
        ? `Attempted to copy: "${copied}"`
        : 'No clipboard text was captured (selection empty or blocked).',
      args.eventType === 'f8'
        ? 'App was force-closed after F8.'
        : 'Copy/cut was blocked in Cloak Desktop.',
    ]
    const message = messageParts.join(' ')

    const warningIds: string[] = []
    if (activeServerIds.length === 0) {
      // Still record a global warning so staff can see unattached incidents.
      const id = await ctx.db.insert('playerWarnings', {
        playerDiscordUsername,
        playerDiscordId: user.discordId,
        message,
        issuedByDiscordUsername: 'cloak-desktop',
        status: 'open',
        createdAt: now,
        updatedAt: now,
      })
      warningIds.push(id)
    } else {
      for (const serverId of activeServerIds) {
        const id = await ctx.db.insert('playerWarnings', {
          playerDiscordUsername,
          playerDiscordId: user.discordId,
          serverId,
          message,
          issuedByDiscordUsername: 'cloak-desktop',
          status: 'open',
          createdAt: now,
          updatedAt: now,
        })
        warningIds.push(id)
      }
    }

    return { ok: true as const, warningIds, count: warningIds.length }
  },
})

export const issueWarning = mutation({
  args: {
    sessionToken: v.string(),
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    serverId: v.optional(v.id('servers')),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const message = args.message.trim()
    const playerDiscordUsername = normalizeUsername(args.playerDiscordUsername)
    if (!playerDiscordUsername) throw new Error('Player Discord username is required.')
    if (message.length < 2) throw new Error('Warning message is required.')

    const now = Date.now()
    return await ctx.db.insert('playerWarnings', {
      playerDiscordUsername,
      playerDiscordId: args.playerDiscordId,
      serverId: args.serverId,
      message,
      issuedByDiscordUsername: actor.discordUsername,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const setWarningStatus = mutation({
  args: {
    sessionToken: v.string(),
    warningId: v.id('playerWarnings'),
    status: warningStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.warningId)
    if (!row) throw new Error('Warning not found.')
    await ctx.db.patch(args.warningId, { status: args.status, updatedAt: Date.now() })
  },
})

export const listPenalties = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await adminFromSession(ctx, args.sessionToken)
    const rows = await ctx.db.query('playerPenalties').collect()
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const issuePenalty = mutation({
  args: {
    sessionToken: v.string(),
    playerDiscordUsername: v.string(),
    playerDiscordId: v.optional(v.string()),
    serverId: v.optional(v.id('servers')),
    amount: v.number(),
    currency: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await ensureAdminLinked(ctx, args.sessionToken)
    const playerDiscordUsername = normalizeUsername(args.playerDiscordUsername)
    const reason = args.reason.trim()
    if (!playerDiscordUsername) throw new Error('Player Discord username is required.')
    if (!Number.isFinite(args.amount) || args.amount < 0) {
      throw new Error('Enter a valid penalty amount.')
    }
    if (reason.length < 2) throw new Error('Reason is required.')

    const now = Date.now()
    return await ctx.db.insert('playerPenalties', {
      playerDiscordUsername,
      playerDiscordId: args.playerDiscordId,
      serverId: args.serverId,
      amount: args.amount,
      currency: args.currency?.trim() || 'USD',
      reason,
      issuedByDiscordUsername: actor.discordUsername,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const setPenaltyStatus = mutation({
  args: {
    sessionToken: v.string(),
    penaltyId: v.id('playerPenalties'),
    status: penaltyStatus,
  },
  handler: async (ctx, args) => {
    await ensureAdminLinked(ctx, args.sessionToken)
    const row = await ctx.db.get(args.penaltyId)
    if (!row) throw new Error('Penalty not found.')
    await ctx.db.patch(args.penaltyId, { status: args.status, updatedAt: Date.now() })
  },
})

/** Servers a player may see — requires a valid session; unauthorized → emoji decoys. */
export const listServersForPlayer = query({
  args: {
    sessionToken: v.optional(v.string()),
    playerDiscordUsername: v.optional(v.string()),
    playerDiscordId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const poison = (seed: string) => ({
      unauthorized: true as const,
      servers: buildEmojiPoisonServers(seed),
    })

    const token = args.sessionToken?.trim() ?? ''
    if (!token) {
      return poison(args.playerDiscordUsername || args.playerDiscordId || 'no-session')
    }

    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique()
    if (!session || session.expiresAt < Date.now()) {
      return poison(args.playerDiscordUsername || args.playerDiscordId || 'expired')
    }

    const user = await userByDiscordId(ctx, session.discordId)
    if (!user || !user.guildVerified) {
      return poison(session.discordId)
    }

    const sessionUsername = normalizeUsername(user.username)
    const requestedUser = args.playerDiscordUsername
      ? normalizeUsername(args.playerDiscordUsername)
      : ''
    const requestedId = args.playerDiscordId?.trim() ?? ''

    // Impersonation / cross-user lookup → scramble instead of leaking.
    if (requestedUser && requestedUser !== sessionUsername) {
      return poison(requestedUser)
    }
    if (requestedId && requestedId !== user.discordId) {
      return poison(requestedId)
    }

    let grants = await ctx.db
      .query('serverAccess')
      .withIndex('by_player_username', (q) =>
        q.eq('playerDiscordUsername', sessionUsername),
      )
      .collect()

    if (grants.length === 0) {
      const byId = await ctx.db
        .query('serverAccess')
        .withIndex('by_player_discord_id', (q) => q.eq('playerDiscordId', user.discordId))
        .collect()
      grants = byId
    }

    const active = grants.filter((g) => {
      if (g.revokedAt) return false
      const status = g.status ?? 'approved'
      return status === 'approved'
    })

    const out = []
    for (const grant of active) {
      const server = await ctx.db.get(grant.serverId)
      if (!server) continue
      out.push({
        id: server._id,
        name: server.name,
        tagline: server.tagline,
        joinEndpoint: server.joinEndpoint,
        region: server.region,
        status: server.status,
        maxPlayers: server.maxPlayers,
        iconUrl: server.iconStorageId ? await ctx.storage.getUrl(server.iconStorageId) : null,
      })
    }

    return { unauthorized: false as const, servers: out }
  },
})
