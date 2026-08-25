import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

type StoredSession = {
  token: string
  expiresAt: number
}

function sessionPath() {
  return path.join(app.getPath('userData'), 'cloak-session.json')
}

export function loadStoredSessionToken(): StoredSession | null {
  try {
    const file = sessionPath()
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as StoredSession
    if (!raw.token) return null
    if (raw.expiresAt && raw.expiresAt < Date.now()) {
      clearStoredSessionToken()
      return null
    }
    return raw
  } catch {
    return null
  }
}

export function saveStoredSessionToken(token: string, expiresAt: number) {
  const file = sessionPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ token, expiresAt }, null, 2), 'utf8')
}

export function clearStoredSessionToken() {
  try {
    const file = sessionPath()
    if (fs.existsSync(file)) fs.unlinkSync(file)
  } catch {
    // ignore
  }
}
