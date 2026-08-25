import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
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

function envFileCandidates() {
  const roots = [
    process.env.APP_ROOT!,
    process.cwd(),
    path.resolve(process.env.APP_ROOT!, '..'),
  ]
  return [...new Set(roots.map((root) => path.join(root, '.env')))]
}

function loadEnvFile() {
  for (const envPath of envFileCandidates()) {
    if (!fs.existsSync(envPath)) continue
    const text = fs.readFileSync(envPath, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, '')
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key) process.env[key] = value
    }
    console.log('[cloak] Loaded env from', envPath)
    return envPath
  }
  console.warn('[cloak] No .env found. Looked in:', envFileCandidates().join(' | '))
  return null
}

loadEnvFile()

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (process.platform === 'win32' && os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration()
}

// Dev must not share userData / single-instance with packaged Cloak.exe,
// or `npm run dev` silently quits and you keep using the release build (no .env).
if (VITE_DEV_SERVER_URL) {
  const devData = path.join(app.getPath('appData'), 'Cloak Desktop Dev')
  app.setPath('userData', devData)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.cloak.app.dev')
  }
} else if (process.platform === 'win32') {
  app.setAppUserModelId('com.cloak.app')
}

if (!app.requestSingleInstanceLock()) {
  console.warn(
    '[cloak] Another Cloak instance is already running — exiting this process. ' +
      'Close Cloak Desktop (tray/taskbar) fully, then run npm run dev again.',
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
    title: 'Cloak Desktop',
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

  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  stopAuthServer()
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', (_event, argv) => {
  const deepLink = argv.find((arg) => arg.startsWith('cloak://'))
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
    app.setAsDefaultProtocolClient('cloak', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('cloak')
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
