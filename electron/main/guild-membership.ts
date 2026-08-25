import {
  getDiscordGuildId,
  getDiscordGuildName,
  getDiscordInviteUrl,
} from './discord-config'

export type MembershipCheckResult =
  | {
      isMember: true
      guildId: string
      guildName: string
    }
  | {
      isMember: false
      guildId: string
      guildName: string
      inviteUrl: string
      reason: 'NOT_IN_GUILD' | 'GUILD_NOT_CONFIGURED' | 'API_ERROR'
      message: string
    }

/**
 * Step 1 — Discord community gate.
 * Uses the user's OAuth token + guilds scope to confirm they are
 * a member of the Cloak Discord server before login can continue.
 */
export async function checkGuildMembership(accessToken: string): Promise<MembershipCheckResult> {
  const guildId = getDiscordGuildId()
  const guildName = getDiscordGuildName()
  const inviteUrl = getDiscordInviteUrl()

  if (!guildId) {
    return {
      isMember: false,
      guildId: '',
      guildName,
      inviteUrl,
      reason: 'GUILD_NOT_CONFIGURED',
      message: 'Cloak community server ID is missing from .env (DISCORD_GUILD_ID).',
    }
  }

  try {
    const guildIds = await fetchAllUserGuildIds(accessToken)
    const isMember = guildIds.includes(guildId)

    if (!isMember) {
      return {
        isMember: false,
        guildId,
        guildName,
        inviteUrl,
        reason: 'NOT_IN_GUILD',
        message: `You must be a member of the ${guildName} Discord server to use Cloak.`,
      }
    }

    return {
      isMember: true,
      guildId,
      guildName,
    }
  } catch (error) {
    return {
      isMember: false,
      guildId,
      guildName,
      inviteUrl,
      reason: 'API_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'Could not verify Discord server membership.',
    }
  }
}

async function fetchAllUserGuildIds(accessToken: string): Promise<string[]> {
  const guildIds: string[] = []
  let after: string | undefined

  // Discord returns up to 200 guilds per page.
  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({ limit: '200' })
    if (after) params.set('after', after)

    const response = await fetch(`https://discord.com/api/users/@me/guilds?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Could not verify Discord server membership. Try signing in again.')
    }

    const guilds = (await response.json()) as Array<{ id: string }>
    if (guilds.length === 0) break

    guildIds.push(...guilds.map((guild) => guild.id))
    after = guilds[guilds.length - 1]?.id

    if (guilds.length < 200) break
  }

  return guildIds
}
