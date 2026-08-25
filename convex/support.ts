import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'

const category = v.union(
  v.literal('install'),
  v.literal('discord'),
  v.literal('servers'),
  v.literal('website'),
  v.literal('other'),
)

const status = v.union(
  v.literal('open'),
  v.literal('in_progress'),
  v.literal('resolved'),
  v.literal('closed'),
)

async function userFromSession(ctx: QueryCtx | MutationCtx, token: string | undefined) {
  if (!token?.trim()) return null
  const session = await ctx.db
    .query('googleSessions')
    .withIndex('by_token', (q) => q.eq('token', token.trim()))
    .unique()
  if (!session || session.expiresAt < Date.now()) return null
  return await ctx.db
    .query('googleUsers')
    .withIndex('by_google_id', (q) => q.eq('googleId', session.googleId))
    .unique()
}

export const createIssue = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    category,
    subject: v.string(),
    description: v.string(),
    discordUsername: v.optional(v.string()),
    preferDiscordSupport: v.boolean(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase()
    const name = args.name.trim()
    const subject = args.subject.trim()
    const description = args.description.trim()
    const discordUsername = args.discordUsername?.trim() || undefined

    if (!email || !email.includes('@')) throw new Error('Enter a valid email.')
    if (!name) throw new Error('Enter your name.')
    if (subject.length < 4) throw new Error('Subject is too short.')
    if (description.length < 10) throw new Error('Describe the issue in a bit more detail.')
    if (args.preferDiscordSupport && !discordUsername) {
      throw new Error('Add your Discord username when requesting Discord support.')
    }

    const sessionUser = await userFromSession(ctx, args.sessionToken)
    const now = Date.now()

    const issueId = await ctx.db.insert('supportIssues', {
      googleId: sessionUser?.googleId,
      email: sessionUser?.email ?? email,
      name: sessionUser?.name ?? name,
      category: args.category,
      subject,
      description,
      discordUsername,
      preferDiscordSupport: args.preferDiscordSupport,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })

    return {
      id: issueId,
      status: 'open' as const,
      preferDiscordSupport: args.preferDiscordSupport,
    }
  },
})

export const listMyIssues = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await userFromSession(ctx, args.sessionToken)
    if (!user) return []

    const issues = await ctx.db
      .query('supportIssues')
      .withIndex('by_google_id', (q) => q.eq('googleId', user.googleId))
      .collect()

    return issues
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((issue) => ({
        id: issue._id,
        category: issue.category,
        subject: issue.subject,
        description: issue.description,
        discordUsername: issue.discordUsername ?? null,
        preferDiscordSupport: issue.preferDiscordSupport,
        status: issue.status,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }))
  },
})

export const updateIssueStatus = mutation({
  args: {
    issueId: v.id('supportIssues'),
    status,
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId)
    if (!issue) throw new Error('Issue not found.')
    await ctx.db.patch(args.issueId, {
      status: args.status,
      updatedAt: Date.now(),
    })
    return { ok: true }
  },
})
