import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export type CloakAppRole = 'user' | 'admin'

function roleFromMarker(): CloakAppRole | null {
  try {
    if (!process.resourcesPath) return null
    const marker = path.join(process.resourcesPath, 'app-role.json')
    if (!fs.existsSync(marker)) return null
    const raw = JSON.parse(fs.readFileSync(marker, 'utf8')) as { role?: string }
    if (raw.role === 'admin') return 'admin'
    if (raw.role === 'user') return 'user'
  } catch {
    // ignore
  }
  return null
}

/** Desktop product flavor — user connector vs admin control panel. */
export function getAppRole(): CloakAppRole {
  const fromEnv = (process.env.CLOAK_APP_ROLE || process.env.VITE_CLOAK_APP_ROLE || '')
    .trim()
    .toLowerCase()
  if (fromEnv === 'admin') return 'admin'
  if (fromEnv === 'user') return 'user'

  const fromMarker = roleFromMarker()
  if (fromMarker) return fromMarker

  try {
    if (/admin/i.test(app.getName())) return 'admin'
  } catch {
    // app may not be ready yet
  }

  return 'user'
}

export function isAdminApp() {
  return getAppRole() === 'admin'
}

export function getAppDisplayName() {
  return isAdminApp() ? 'Cloak Admin' : 'Cloak Desktop'
}

/** Local OAuth callback port — unique so User + Admin can run at once. */
export function getAuthPort() {
  const fromEnv = Number(process.env.CLOAK_AUTH_PORT || '')
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv
  return isAdminApp() ? 19284 : 19283
}

export function getAppProtocol() {
  return isAdminApp() ? 'cloak-admin' : 'cloak'
}

export function getAppUserModelId(dev = false) {
  if (isAdminApp()) return dev ? 'com.cloak.admin.dev' : 'com.cloak.admin'
  return dev ? 'com.cloak.app.dev' : 'com.cloak.app'
}

export function getDefaultRedirectUri() {
  return `http://127.0.0.1:${getAuthPort()}/callback`
}
