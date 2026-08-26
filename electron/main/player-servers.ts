import { shell } from 'electron'
import { makeFunctionReference } from 'convex/server'
import { ConvexHttpClient } from 'convex/browser'
import { restoreUserSession } from './convex-client'
import { loadStoredSessionToken } from './session-store'

export type PlayerServerCard = {
  id: string
  name: string
  tagline: string
  players: number
  maxPlayers: number
  ping: number
  status: 'online' | 'maintenance' | 'offline'
  region: string
  protected: boolean
  iconUrl?: string | null
}

type PlayerServerRow = {
  id: string
  name: string
  tagline?: string
  joinEndpoint: string
  region?: string
  status: 'online' | 'maintenance' | 'offline'
  maxPlayers: number
  iconUrl?: string | null
}

type ListServersForPlayerResult = {
  unauthorized: boolean
  servers: PlayerServerRow[]
}

const listServersForPlayerFn = makeFunctionReference<
  'query',
  {
    sessionToken?: string
    playerDiscordUsername?: string
    playerDiscordId?: string
  },
  ListServersForPlayerResult
>('admin:listServersForPlayer')

function getConvexUrl() {
  return (
    process.env.CONVEX_URL?.trim() ||
    process.env.VITE_CONVEX_URL?.trim() ||
    'https://sleek-shark-313.convex.cloud'
  )
}

function client() {
  return new ConvexHttpClient(getConvexUrl())
}

async function requireSession() {
  const stored = loadStoredSessionToken()
  if (!stored?.token) {
    throw new Error('Sign in with Discord to see your servers.')
  }
  const session = await restoreUserSession(stored.token)
  if (!session?.user || !session.token) {
    throw new Error('Session expired. Sign in with Discord again.')
  }
  return session
}

function mapServerCard(row: PlayerServerRow): PlayerServerCard {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline?.trim() || 'Protected FiveM server',
    players: 0,
    maxPlayers: row.maxPlayers || 32,
    ping: 0,
    status: row.status,
    region: row.region?.trim() || 'Unknown',
    protected: true,
    iconUrl: row.iconUrl ?? null,
  }
}

type DataPoisonListener = (payload: { reason: string }) => void
const poisonListeners = new Set<DataPoisonListener>()

export function onDataPoisoned(listener: DataPoisonListener) {
  poisonListeners.add(listener)
  return () => poisonListeners.delete(listener)
}

function emitDataPoisoned(reason: string) {
  for (const listener of poisonListeners) {
    try {
      listener({ reason })
    } catch (error) {
      console.error('[cloak] data-poison listener failed:', error)
    }
  }
}

async function fetchPlayerServers() {
  const session = await requireSession()
  const result = await client().query(listServersForPlayerFn, {
    sessionToken: session.token,
    playerDiscordUsername: session.user.username,
    playerDiscordId: session.user.id,
  })
  if (result.unauthorized) {
    emitDataPoisoned('unauthorized-server-list')
  }
  return result
}

/** List servers the signed-in Discord user is approved to join (no endpoints in UI). */
export async function listPlayerServers(): Promise<{
  ok: boolean
  unauthorized: boolean
  servers: PlayerServerCard[]
  error?: string
}> {
  try {
    const result = await fetchPlayerServers()
    if (result.unauthorized) {
      return {
        ok: false,
        unauthorized: true,
        servers: result.servers.map(mapServerCard),
        error: 'Unauthorized access detected. Data scrambled.',
      }
    }
    return {
      ok: true,
      unauthorized: false,
      servers: result.servers.map(mapServerCard),
    }
  } catch (error) {
    return {
      ok: false,
      unauthorized: false,
      error: error instanceof Error ? error.message : 'Could not load servers.',
      servers: [],
    }
  }
}

function buildFiveMConnectUrl(joinEndpoint: string) {
  const endpoint = joinEndpoint.trim()
  if (!endpoint) return null
  // Never launch FiveM with emoji-poison decoy endpoints.
  if (/poison_/i.test(endpoint) || /[\u{1F300}-\u{1FAFF}]/u.test(endpoint)) {
    return null
  }

  if (/^fivem:\/\//i.test(endpoint)) return endpoint

  const cfxJoin = endpoint.match(/cfx\.re\/join\/([a-zA-Z0-9]+)/i)
  if (cfxJoin) {
    return `fivem://connect/cfx.re/join/${cfxJoin[1]}`
  }

  if (/^https?:\/\//i.test(endpoint)) {
    try {
      const url = new URL(endpoint)
      if (/\/join\//i.test(url.pathname)) {
        return `fivem://connect/${url.host}${url.pathname.replace(/\/$/, '')}`
      }
      return `fivem://connect/${url.host}`
    } catch {
      return null
    }
  }

  const withoutConnect = endpoint.replace(/^connect\s+/i, '').trim()
  if (!withoutConnect) return null
  return `fivem://connect/${withoutConnect}`
}

/**
 * Resolve join endpoint in main only (never sent to renderer), then open FiveM.
 */
export async function joinProtectedServer(serverId: string) {
  if (!serverId.trim()) {
    return { ok: false as const, message: 'Server not found.' }
  }

  try {
    const result = await fetchPlayerServers()
    if (result.unauthorized) {
      emitDataPoisoned('unauthorized-join')
      return {
        ok: false as const,
        unauthorized: true as const,
        message: 'Unauthorized access detected. Connection blocked.',
      }
    }

    const server = result.servers.find((row) => row.id === serverId)
    if (!server) {
      return {
        ok: false as const,
        message: 'You do not have access to this server, or it was removed.',
      }
    }
    if (server.status !== 'online') {
      return {
        ok: false as const,
        message:
          server.status === 'maintenance'
            ? 'This server is under maintenance.'
            : 'This server is offline right now.',
      }
    }

    const connectUrl = buildFiveMConnectUrl(server.joinEndpoint)
    if (!connectUrl) {
      return { ok: false as const, message: 'Server connect details are missing.' }
    }

    await shell.openExternal(connectUrl)
    return {
      ok: true as const,
      message: 'Launching FiveM and connecting… Keep FiveM installed and signed in.',
    }
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'Could not connect to server.',
    }
  }
}
