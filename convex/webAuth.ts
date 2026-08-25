import { action, internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

const SESSION_DAYS = 30

function makeSessionToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function mapUser(args: {
  googleId: string
  email: string
  name: string
  picture: string | null
}) {
  return {
    id: args.googleId,
    email: args.email,
    name: args.name,
    picture: args.picture,
  }
}

export const upsertFromGoogle = internalMutation({
  args: {
    googleId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('googleUsers')
      .withIndex('by_google_id', (q) => q.eq('googleId', args.googleId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        picture: args.picture,
        lastLoginAt: now,
      })
    } else {
      await ctx.db.insert('googleUsers', {
        googleId: args.googleId,
        email: args.email,
        name: args.name,
        picture: args.picture,
        lastLoginAt: now,
        createdAt: now,
      })
    }

    const oldSessions = await ctx.db
      .query('googleSessions')
      .withIndex('by_google_id', (q) => q.eq('googleId', args.googleId))
      .collect()
    for (const session of oldSessions) {
      await ctx.db.delete(session._id)
    }

    const token = makeSessionToken()
    const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000
    await ctx.db.insert('googleSessions', {
      token,
      googleId: args.googleId,
      createdAt: now,
      expiresAt,
      lastSeenAt: now,
    })

    return { token, expiresAt, user: mapUser(args) }
  },
})

export const signInWithGoogle = action({
  args: { idToken: v.string() },
  handler: async (ctx, args) => {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(args.idToken)}`,
    )
    if (!res.ok) {
      throw new Error('Google sign-in failed. Try again.')
    }

    const payload = (await res.json()) as {
      aud?: string
      iss?: string
      sub?: string
      email?: string
      email_verified?: string | boolean
      name?: string
      picture?: string
    }

    const issuerOk =
      payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com'
    const verified = payload.email_verified === true || payload.email_verified === 'true'
    const expectedAud = process.env.GOOGLE_CLIENT_ID?.trim()
    const audOk = !expectedAud || payload.aud === expectedAud

    if (!issuerOk || !verified || !audOk || !payload.sub || !payload.email) {
      throw new Error('Google could not verify this account.')
    }

    return await ctx.runMutation(internal.webAuth.upsertFromGoogle, {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name?.trim() || payload.email.split('@')[0] || 'Cloak member',
      picture: payload.picture ?? null,
    })
  },
})

export const getGoogleSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('googleSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()

    if (!session || session.expiresAt < Date.now()) return null

    const user = await ctx.db
      .query('googleUsers')
      .withIndex('by_google_id', (q) => q.eq('googleId', session.googleId))
      .unique()

    if (!user) return null

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: mapUser(user),
    }
  },
})

export const revokeGoogleSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('googleSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()
    if (session) await ctx.db.delete(session._id)
    return { ok: true as const }
  },
})
