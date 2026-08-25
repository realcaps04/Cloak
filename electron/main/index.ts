import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import {
  getAppDisplayName,
  getAppProtocol,
  getAppUserModelId,
  isAdminApp,
} from './app-role'
import { update } from './update'
import {
  startDiscordAuth,
  handleAuthCallback,
  stopAuthServer,
  openDiscordInvite,
  joinCommunityAndVerify,
  cancelDiscordAuth,
  type AuthResult,
} from './discord-auth'
import { joinProtectedServer } from './join-server'
import {
  getDiscordCommunity,
  getDiscordConfigStatus,
  isDiscordAuthConfigured,
} from './discord-config'
import { restoreUserSession, revokeUserSession, saveUserSession } from './convex-client'
import {
  clearStoredSessionToken,
  loadStoredSessionToken,
  saveStoredSessionToken,
} from './session-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

// Dev admin runs on :5175 — force role before userData / single-instance lock.
if (
  process.env.VITE_DEV_SERVER_URL?.includes(':5175') ||
  process.env.VITE_CLOAK_APP_ROLE === 'admin' ||
  process.env.CLOAK_APP_ROLE === 'admin'
) {
  process.env.CLOAK_APP_ROLE = 'admin'
  process.env.VITE_CLOAK_APP_ROLE = 'admin'
}

function applyEnvFile(envPath: string, seen: Set<string>) {
  if (!fs.existsSync(envPath)) return 0
  let added = 0
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, '')
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!key || seen.has(key)) continue
    // Never let a later .env file downgrade an already-selected admin role.
    if (
      (key === 'CLOAK_APP_ROLE' || key === 'VITE_CLOAK_APP_ROLE') &&
      process.env.CLOAK_APP_ROLE === 'admin'
    ) {
      seen.add(key)
      continue
    }
    process.env[key] = value
    seen.add(key)
    added += 1
  }
  return added
}

function envFileCandidates() {
  const candidates: string[] = []
  const admin = process.env.CLOAK_APP_ROLE === 'admin' || process.env.VITE_CLOAK_APP_ROLE === 'admin'

  // Admin mode: prefer .env.admin so role + redirects win.
  if (admin) {
    candidates.push(path.join(process.env.APP_ROOT!, '.env.admin'))
  }

  // Packaged / portable: secrets are baked into resources at build time.
  try {
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'cloak-runtime.env'))
    }
  } catch {
    // ignore
  }

  // Next to the running executable (portable folder / custom installs)
  try {
    const exeDir = path.dirname(app.getPath('exe'))
    candidates.push(path.join(exeDir, 'cloak-runtime.env'))
    candidates.push(path.join(exeDir, '.env'))
  } catch {
    // app path may not be ready yet
  }

  // Only this app folder + cwd — never parent (avoids Cloak_Admin/.env flipping player role).
  const roots = [process.env.APP_ROOT!, process.cwd()]

  for (const root of roots) {
    candidates.push(path.join(root, '.env'))
    candidates.push(path.join(root, 'cloak-runtime.env'))
  }

  // Do NOT load .env.admin for the player app — it sets CLOAK_APP_ROLE=admin and
  // Discord then gets redirect :19284 → "Invalid OAuth2 redirect_uri".
  // Admin lives in the sibling Cloak_Admin folder (or `vite --mode admin`).

  return [...new Set(candidates.filter(Boolean))]
}

function loadEnvFile() {
  const looked: string[] = []
  const seen = new Set<string>()
  let loadedAny = false

  for (const envPath of envFileCandidates()) {
    looked.push(envPath)
    const added = applyEnvFile(envPath, seen)
    if (added > 0) {
      loadedAny = true
      console.log('[cloak] Loaded env from', envPath)
    }
  }

  if (!loadedAny) {
    console.warn('[cloak] No env file found. Looked in:', looked.join(' | '))
    return null
  }

  return 'merged'
}

// Load again after app is ready so resourcesPath / exe path resolve correctly.
function loadEnvWhenReady() {
  loadEnvFile()
  if (app.isReady()) return
  app.whenReady().then(() => {
    loadEnvFile()
  })
}

loadEnvWhenReady()

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (process.platform === 'win32' && os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration()
}

// Separate userData so User + Admin (and packaged vs dev) can run side by side.
{
  const role = isAdminApp() ? 'admin' : 'user'
  const displayName = getAppDisplayName()
  app.setName(displayName)
  console.log(`[cloak] App role=${role} name=${displayName}`)

  if (VITE_DEV_SERVER_URL) {
    const folder = isAdminApp() ? 'Cloak Admin Dev' : 'Cloak Desktop Dev'
    app.setPath('userData', path.join(app.getPath('appData'), folder))
    if (process.platform === 'win32') app.setAppUserModelId(getAppUserModelId(true))
  } else {
    if (isAdminApp()) {
      app.setPath('userData', path.join(app.getPath('appData'), 'Cloak Admin'))
    }
    if (process.platform === 'win32') app.setAppUserModelId(getAppUserModelId(false))
  }
}

// Packaged: one window only. Dev: skip lock so Vite Electron HMR restarts don't
// immediately quit and tear down `npm run dev`.
if (!VITE_DEV_SERVER_URL && !app.requestSingleInstanceLock()) {
  console.warn(
    `[cloak] Another ${getAppDisplayName()} instance is already running — exiting this process.`,
  )
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preloadCandidates = [
  path.join(__dirname, '../preload/index.cjs'),
  path.join(__dirname, '../preload/index.js'),
  path.join(__dirname, '../preload/index.mjs'),
]
const preload =
  preloadCandidates.find((candidate) => fs.existsSync(candidate)) ?? preloadCandidates[0]
const indexHtml = path.join(RENDERER_DIST, 'index.html')

function sendAuthResult(payload: AuthResult) {
  win?.webContents.send('cloak:auth-result', payload)
}

/** Persist Discord login to Convex users + sessions tables. */
async function persistAuthResult(result: AuthResult): Promise<AuthResult> {
  if (!result.ok) return result

  try {
    const persisted = await saveUserSession(result.user)
    saveStoredSessionToken(persisted.token, persisted.expiresAt)
    return { ok: true, user: persisted.user }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not save your session to Convex.'
    return {
      ok: false,
      error: `Logged in with Discord, but Convex save failed: ${message}`,
      code: 'UNKNOWN',
    }
  }
}

async function createWindow() {
  win = new BrowserWindow({
    title: getAppDisplayName(),
    width: 1180,
    height: 740,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#070809',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#070809',
      symbolColor: '#C8CDD5',
      height: 36,
    },
    icon: path.join(process.env.VITE_PUBLIC!, 'cloak_app_icon.png'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => win?.show())

  win.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('[cloak] Preload failed:', preloadPath, error)
  })

  if (!fs.existsSync(preload)) {
    console.error('[cloak] Preload script missing:', preload)
  } else {
    console.log('[cloak] Using preload:', preload)
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Store / Admin: skip GitHub portable updater (Store updates; Admin feed comes later).
  const windowsStore = Boolean(
    (process as NodeJS.Process & { windowsStore?: boolean }).windowsStore,
  )
  if (!windowsStore && !isAdminApp()) {
    update(win)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  stopAuthServer()
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', (_event, argv) => {
  const protocol = getAppProtocol()
  const deepLink = argv.find((arg) => arg.startsWith(`${protocol}://`))
  if (deepLink) {
    void handleAuthCallback(deepLink)
      .then(persistAuthResult)
      .then(sendAuthResult)
  }
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    void createWindow()
  }
})

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(getAppProtocol(), process.execPath, [
      path.resolve(process.argv[1]),
    ])
  }
} else {
  app.setAsDefaultProtocolClient(getAppProtocol())
}

ipcMain.handle('cloak:window-minimize', () => win?.minimize())
ipcMain.handle('cloak:window-maximize', () => {
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
})
ipcMain.handle('cloak:window-close', () => win?.close())

ipcMain.handle('cloak:discord-login', async () => {
  try {
    return await persistAuthResult(await startDiscordAuth())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discord login failed'
    return { ok: false as const, error: message, code: 'UNKNOWN' as const }
  }
})

ipcMain.handle('cloak:join-and-verify', async () => {
  try {
    return await persistAuthResult(await joinCommunityAndVerify())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not join and verify'
    return { ok: false as const, error: message, code: 'UNKNOWN' as const }
  }
})

ipcMain.handle('cloak:restore-session', async () => {
  try {
    const stored = loadStoredSessionToken()
    if (!stored) return { ok: false as const }

    const restored = await restoreUserSession(stored.token)
    if (!restored) {
      clearStoredSessionToken()
      return { ok: false as const }
    }

    saveStoredSessionToken(restored.token, restored.expiresAt)
    return { ok: true as const, user: restored.user }
  } catch {
    clearStoredSessionToken()
    return { ok: false as const }
  }
})

ipcMain.handle('cloak:logout', async () => {
  const stored = loadStoredSessionToken()
  if (stored?.token) {
    try {
      await revokeUserSession(stored.token)
    } catch {
      // still clear local session
    }
  }
  clearStoredSessionToken()
  return { ok: true as const }
})

ipcMain.handle('cloak:discord-configured', () => {
  loadEnvFile()
  return isDiscordAuthConfigured()
})

ipcMain.handle('cloak:discord-config-status', () => {
  loadEnvFile()
  return getDiscordConfigStatus()
})

ipcMain.handle('cloak:discord-community', () => {
  loadEnvFile()
  return getDiscordCommunity()
})

ipcMain.handle('cloak:cancel-discord-auth', () => {
  cancelDiscordAuth()
  return { ok: true as const }
})

ipcMain.handle('cloak:open-discord-invite', () => openDiscordInvite())

ipcMain.handle('cloak:join-server', async (_event, serverId: string) => {
  try {
    return await joinProtectedServer(serverId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not connect to server'
    return { ok: false as const, message }
  }
})
