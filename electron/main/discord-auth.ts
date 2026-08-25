import http from 'node:http'
import { shell } from 'electron'
import { randomBytes } from 'node:crypto'

export type CloakUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
}

type AuthResult = { ok: true; user: CloakUser } | { ok: false; error: string }

const AUTH_PORT = 19283
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? `http://127.0.0.1:${AUTH_PORT}/callback`

let authServer: http.Server | null = null
let pendingState: string | null = null
let pendingResolve: ((result: AuthResult) => void) | null = null

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
      .box { text-align: center; padding: 2rem; }
      h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
      p { opacity: .7; margin: 0; }
    </style>
  </head>
  <body><div class="box">${body}</div></body>
</html>`
}

export function stopAuthServer() {
  if (authServer) {
    authServer.close()
    authServer = null
  }
  pendingState = null
  pendingResolve = null
}

async function exchangeCode(code: string): Promise<CloakUser> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Discord is not configured. Add credentials to your .env file.')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
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
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })

  if (!userRes.ok) {
    throw new Error('Could not load your Discord profile.')
  }

  const user = (await userRes.json()) as {
    id: string
    username: string
    global_name: string | null
    avatar: string | null
    discriminator: string
  }

  const guildId = process.env.DISCORD_GUILD_ID
  if (guildId) {
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    if (!guildsRes.ok) {
      throw new Error('Could not verify Discord server membership.')
    }
    const guilds = (await guildsRes.json()) as Array<{ id: string }>
    if (!guilds.some((g) => g.id === guildId)) {
      throw new Error('You must join the Cloak Discord server before signing in.')
    }
  }

  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    avatar: user.avatar,
    discriminator: user.discriminator,
  }
}

function settle(result: AuthResult) {
  pendingResolve?.(result)
  pendingResolve = null
  pendingState = null
  stopAuthServer()
}

export async function handleAuthCallback(url: string): Promise<AuthResult> {
  try {
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    const error = parsed.searchParams.get('error')

    if (error) {
      const result: AuthResult = { ok: false, error: 'Discord login was cancelled.' }
      settle(result)
      return result
    }

    if (!code || !state || state !== pendingState) {
      const result: AuthResult = { ok: false, error: 'Invalid Discord login response.' }
      settle(result)
      return result
    }

    const user = await exchangeCode(code)
    const result: AuthResult = { ok: true, user }
    settle(result)
    return result
  } catch (error) {
    const result: AuthResult = {
      ok: false,
      error: error instanceof Error ? error.message : 'Discord login failed',
    }
    settle(result)
    return result
  }
}

export function startDiscordAuth(): Promise<AuthResult> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return Promise.resolve({
      ok: false,
      error: 'Discord is not set up yet. Copy .env.example to .env and add your Discord app keys.',
    })
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

      const fullUrl = `http://127.0.0.1:${AUTH_PORT}${req.url}`
      const result = await handleAuthCallback(fullUrl)

      if (result.ok) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(htmlPage('Cloak', '<h1>You are in</h1><p>You can close this tab and return to Cloak.</p>'))
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end(htmlPage('Cloak', `<h1>Login failed</h1><p>${result.error}</p>`))
      }
    })

    authServer.listen(AUTH_PORT, '127.0.0.1', async () => {
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: 'identify guilds',
        state: pendingState!,
        prompt: 'consent',
      })

      const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`
      await shell.openExternal(authUrl)
    })

    authServer.on('error', () => {
      settle({ ok: false, error: 'Could not start the local Discord login helper.' })
    })

    setTimeout(() => {
      if (pendingResolve) {
        settle({ ok: false, error: 'Discord login timed out. Please try again.' })
      }
    }, 5 * 60 * 1000)
  })
}
