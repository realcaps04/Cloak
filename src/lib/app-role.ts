export type CloakAppRole = 'user' | 'admin'

/** Renderer-side product flavor (Vite mode / VITE_CLOAK_APP_ROLE). */
export function getAppRole(): CloakAppRole {
  const role = (import.meta.env.VITE_CLOAK_APP_ROLE || 'user').toString().trim().toLowerCase()
  return role === 'admin' ? 'admin' : 'user'
}

export function isAdminApp() {
  return getAppRole() === 'admin'
}

export function getAppDisplayName() {
  return isAdminApp() ? 'Cloak Admin' : 'Cloak Desktop'
}
