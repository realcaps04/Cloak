import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { update } from './update'
import { startDiscordAuth, handleAuthCallback, stopAuthServer } from './discord-auth'
import type { CloakUser } from './discord-auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

function loadEnvFile() {
  const envPath = path.join(process.env.APP_ROOT!, '.env')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
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

if (process.platform === 'win32') {
  app.setAppUserModelId('com.cloak.app')
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

function sendAuthResult(payload: { ok: true; user: CloakUser } | { ok: false; error: string }) {
  win?.webContents.send('cloak:auth-result', payload)
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Cloak',
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
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => win?.show())

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
    void handleAuthCallback(deepLink).then(sendAuthResult)
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
    return await startDiscordAuth()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discord login failed'
    return { ok: false as const, error: message }
  }
})

ipcMain.handle('cloak:discord-configured', () => {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
})
