export function isElectronApp() {
  return typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent)
}

export function getConvexUrl() {
  return (
    import.meta.env.VITE_CONVEX_URL?.trim() ||
    'https://sleek-shark-313.convex.cloud'
  )
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''
}

/** Windows NSIS installer URL for Cloak User (desktop). */
export function getCloakDownloadUrl() {
  return (
    import.meta.env.VITE_CLOAK_DOWNLOAD_URL?.trim() ||
    'https://github.com/realcaps04/Cloak/releases/latest/download/Cloak_0.1.0.exe'
  )
}

export function getCloakAppVersion() {
  return import.meta.env.VITE_CLOAK_APP_VERSION?.trim() || '0.1.0'
}
