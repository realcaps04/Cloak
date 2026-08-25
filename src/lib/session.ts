import type { CloakUser } from './types'

const KEY = 'cloak.session.v1'

export function loadSession(): CloakUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as CloakUser
  } catch {
    return null
  }
}

export function saveSession(user: CloakUser) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
