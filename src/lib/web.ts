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
