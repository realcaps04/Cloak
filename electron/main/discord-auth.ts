import http from 'node:http'
import { shell, BrowserWindow } from 'electron'
import { randomBytes } from 'node:crypto'
import {
  getDiscordClientId,
  getDiscordClientSecret,
  getDiscordGuildId,
  getDiscordGuildName,
  getDiscordInviteUrl,
  getDiscordRedirectUri,
  isDiscordAuthConfigured,
} from './discord-config'
import { checkGuildMembership } from './guild-membership'
import { getAppDisplayName, getAppRole, getAuthPort } from './app-role'

export type CloakUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
  guildVerified: boolean
  guildId?: string
  guildName?: string
}

export type AuthErrorCode =
  | 'NOT_CONFIGURED'
  | 'NOT_IN_GUILD'
  | 'CANCELLED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN'

export type AuthResult =
  | { ok: true; user: CloakUser }
  | { ok: false; error: string; code: AuthErrorCode; inviteUrl?: string }

export type MembershipWaitingPayload = {
  message: string
  guildName: string
  inviteUrl: string
}

const MEMBERSHIP_POLL_MS = 4000
/** Keep membership wait short enough for Store certification (no indefinite load). */
const MEMBERSHIP_WAIT_MS = 2 * 60 * 1000
/** Hard cap for the whole Discord OAuth flow (browser never returns). */
const AUTH_FLOW_TIMEOUT_MS = 90 * 1000

let authServer: http.Server | null = null
let pendingState: string | null = null
let pendingResolve: ((result: AuthResult) => void) | null = null
let membershipPollTimer: ReturnType<typeof setTimeout> | null = null
let authFlowTimer: ReturnType<typeof setTimeout> | null = null
let membershipWaitDeadline = 0

function clearAuthFlowTimer() {
  if (authFlowTimer) {
    clearTimeout(authFlowTimer)
    authFlowTimer = null
  }
}

function authPort() {
  return getAuthPort()
}

function getRedirectUri() {
  const configured = getDiscordRedirectUri()
  const port = authPort()
  if (configured.includes(String(port))) return configured
  return `http://127.0.0.1:${port}/callback`
}

function inviteCodeFromUrl(inviteUrl: string) {
  try {
    const parsed = new URL(inviteUrl)
    const parts = parsed.pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] ?? ''
  } catch {
    return ''
  }
}

function htmlPage(title: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #070809;
        color: #e8eaed;
        font-family: Segoe UI, sans-serif;
      }
      .box { text-align: center; padding: 2rem; max-width: 28rem; }
      h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
      p { opacity: .7; margin: 0; line-height: 1.5; }
      a {
        display: inline-block;
        margin-top: 1rem;
        color: #22c55e;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body><div class="box">${body}</div></body>
</html>`
}

function clearMembershipPoll() {
  if (membershipPollTimer) {
    clearTimeout(membershipPollTimer)
    membershipPollTimer = null
  }
  membershipWaitDeadline = 0
}

export function stopAuthServer() {
  clearMembershipPoll()
  clearAuthFlowTimer()
  if (authServer) {
    authServer.close()
    authServer = null
  }
  pendingState = null
  pendingResolve = null
}

/** Stop an in-progress OAuth / membership wait and re-enable the login UI. */
export function cancelDiscordAuth() {
  if (pendingResolve) {
    settle(authFailure('Sign-in cancelled.', 'CANCELLED'))
  } else {
    stopAuthServer()
  }
}

function emitWaiting(payload: MembershipWaitingPayload) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('cloak:membership-waiting', payload)
  }
}

function settle(result: AuthResult) {
  clearMembershipPoll()
  clearAuthFlowTimer()
  pendingResolve?.(result)
  pendingResolve = null
  pendingState = null
  if (authServer) {
    authServer.close()
    authServer = null
  }

  if (result.ok) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }
}

function authFailure(
  error: string,
  code: AuthErrorCode,
  inviteUrl?: string,
): AuthResult {
  return inviteUrl ? { ok: false, error, code, inviteUrl } : { ok: false, error, code }
}

async function fetchDiscordProfile(accessToken: string) {
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    throw new Error('Could not load your Discord profile.')
  }

  return (await userRes.json()) as {
    id: string
    username: string
    global_name: string | null
    avatar: string | null
    discriminator: string
  }
}

function toCloakUser(
  user: Awaited<ReturnType<typeof fetchDiscordProfile>>,
  guildId: string,
  guildName: string,
): CloakUser {
  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    avatar: user.avatar,
    discriminator: user.discriminator,
    guildVerified: true,
    guildId,
    guildName,
  }
}

async function waitForMembership(
  accessToken: string,
  profile: Awaited<ReturnType<typeof fetchDiscordProfile>>,
): Promise<CloakUser> {
  const inviteUrl = getDiscordInviteUrl()
  const guildName = getDiscordGuildName()

  emitWaiting({
    message: `Waiting for you to join ${guildName}. Cloak will continue automatically.`,
    guildName,
    inviteUrl,
  })

  membershipWaitDeadline = Date.now() + MEMBERSHIP_WAIT_MS

  return new Promise((resolve, reject) => {
    const tick = async () => {
      if (Date.now() > membershipWaitDeadline) {
        reject(
          Object.assign(new Error(`Timed out waiting for ${guildName} membership.`), {
            code: 'NOT_IN_GUILD' as AuthErrorCode,
            inviteUrl,
          }),
        )
        return
      }

      const membership = await checkGuildMembership(accessToken)
      if (membership.isMember) {
        resolve(toCloakUser(profile, membership.guildId, membership.guildName))
        return
      }

      if (membership.reason === 'API_ERROR') {
        reject(new Error(membership.message))
        return
      }

      emitWaiting({
        message: `Still waiting… join ${guildName} in Discord. Cloak checks every few seconds.`,
        guildName,
        inviteUrl,
      })

      membershipPollTimer = setTimeout(() => {
        void tick()
      }, MEMBERSHIP_POLL_MS)
    }

    void tick()
  })
}

async function completeLoginFromAccessToken(accessToken: string): Promise<CloakUser> {
  const profile = await fetchDiscordProfile(accessToken)
  const membership = await checkGuildMembership(accessToken)

  if (membership.isMember) {
    return toCloakUser(profile, membership.guildId, membership.guildName)
  }

  if (membership.reason === 'GUILD_NOT_CONFIGURED' || membership.reason === 'API_ERROR') {
    const err = new Error(membership.message) as Error & {
      code: AuthErrorCode
      inviteUrl?: string
    }
    err.code = 'UNKNOWN'
    err.inviteUrl = membership.inviteUrl
    throw err
  }

  // Not in server yet — keep token and poll in background until they join
  return waitForMembership(accessToken, profile)
}

async function exchangeCode(code: string): Promise<CloakUser> {
  const clientId = getDiscordClientId()
  const clientSecret = getDiscordClientSecret()
  const redirectUri = getRedirectUri()

  if (!clientId || !clientSecret) {
    throw new Error('Discord is not configured. Add credentials to your .env file.')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!tokenRes.ok) {
    throw new Error('Could not finish Discord login. Try again.')
  }

  const tokenJson = (await tokenRes.json()) as { access_token: string }
  return completeLoginFromAccessToken(tokenJson.access_token)
}

export async function handleAuthCallback(url: string): Promise<AuthResult> {
  try {
    // Browser returned — stop the OAuth-wait timer; membership has its own deadline.
    clearAuthFlowTimer()

    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    const error = parsed.searchParams.get('error')

    if (error) {
      const result = authFailure('Discord login was cancelled.', 'CANCELLED')
      settle(result)
      return result
    }

    if (!code || !state || state !== pendingState) {
      const result = authFailure('Invalid Discord login response.', 'INVALID_RESPONSE')
      settle(result)
      return result
    }

    // Keep pendingResolve alive during membership polling
    const user = await exchangeCode(code)
    const result: AuthResult = { ok: true, user }
    settle(result)
    return result
  } catch (error) {
    const typed = error as Error & { code?: AuthErrorCode; inviteUrl?: string }
    const result = authFailure(
      typed.message || 'Discord login failed',
      typed.code ?? 'UNKNOWN',
      typed.inviteUrl,
    )
    settle(result)
    return result
  }
}

/** Open Discord app (preferred) or website and jump to the Cloak invite/server. */
export async function openDiscordInvite() {
  const inviteUrl = getDiscordInviteUrl()
  const code = inviteCodeFromUrl(inviteUrl)
  const guildId = getDiscordGuildId()

  const candidates = [
    code ? `discord://-/invite/${code}` : '',
    guildId ? `discord://-/channels/${guildId}` : '',
    inviteUrl,
  ].filter(Boolean)

  for (const url of candidates) {
    try {
      await shell.openExternal(url)
      return
    } catch {
      // try next candidate
    }
  }
}

type StartAuthOptions = {
  /** Open Discord invite/server first, then OAuth for background verification */
  openInviteFirst?: boolean
}

export function startDiscordAuth(options: StartAuthOptions = {}): Promise<AuthResult> {
  const clientId = getDiscordClientId()
  const inviteUrl = getDiscordInviteUrl()
  const guildName = getDiscordGuildName()
  const redirectUri = getRedirectUri()
  console.log(
    `[cloak] Discord OAuth start role=${getAppRole()} port=${authPort()} redirect_uri=${redirectUri}`,
  )

  if (!isDiscordAuthConfigured()) {
    return Promise.resolve(
      authFailure(
        'Discord is not set up yet. Add Client ID and Client Secret to your .env file.',
        'NOT_CONFIGURED',
        inviteUrl,
      ),
    )
  }

  stopAuthServer()
  pendingState = randomBytes(16).toString('hex')

  return new Promise((resolve) => {
    pendingResolve = resolve

    authServer = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const fullUrl = `http://127.0.0.1:${authPort()}${req.url}`

      // Respond quickly so the browser tab isn't stuck while we poll membership
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        htmlPage(
          getAppDisplayName(),
          `<h1>Connected</h1><p>Return to ${getAppDisplayName()}. If you are not in ${guildName} yet, join in Discord — Cloak verifies in the background.</p>`,
        ),
      )

      void handleAuthCallback(fullUrl)
    })

    authServer.listen(authPort(), '127.0.0.1', async () => {
      if (options.openInviteFirst) {
        await openDiscordInvite()
        // Brief pause so Discord can take focus before OAuth browser opens
        await new Promise((r) => setTimeout(r, 900))
      }

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'identify guilds',
        state: pendingState!,
        prompt: 'consent',
      })

      const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`
      await shell.openExternal(authUrl)
    })

    authServer.on('error', () => {
      settle(authFailure('Could not start the local Discord login helper.', 'UNKNOWN'))
    })

    clearAuthFlowTimer()
    authFlowTimer = setTimeout(() => {
      if (pendingResolve) {
        settle(
          authFailure(
            'Discord sign-in timed out. Complete authorization in the browser within 90 seconds, or tap Cancel and try again.',
            'UNKNOWN',
          ),
        )
      }
    }, AUTH_FLOW_TIMEOUT_MS)
  })
}

/** Join Cloak community in Discord, then verify membership and sign in. */
export function joinCommunityAndVerify(): Promise<AuthResult> {
  return startDiscordAuth({ openInviteFirst: true })
}
