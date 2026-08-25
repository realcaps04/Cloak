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

const GITHUB_OWNER = 'realcaps04'
const GITHUB_REPO = 'Cloak'

/** Stable filename so /releases/latest/download/Cloak.exe always hits the newest release. */
export const CLOAK_RELEASE_EXE = 'Cloak.exe'

/** Always resolves to the current GitHub “latest” release asset. */
export function getCloakDownloadUrl() {
  return (
    import.meta.env.VITE_CLOAK_DOWNLOAD_URL?.trim() ||
    `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/${CLOAK_RELEASE_EXE}`
  )
}

export function getCloakAppVersion() {
  return import.meta.env.VITE_CLOAK_APP_VERSION?.trim() || 'latest'
}

export type LatestCloakRelease = {
  version: string
  downloadUrl: string
  publishedAt: string | null
}

/**
 * Resolve the newest published Windows build from GitHub Releases.
 * Falls back to the stable /latest/download/Cloak.exe URL when the API is unavailable.
 */
export async function fetchLatestCloakRelease(): Promise<LatestCloakRelease> {
  const fallback: LatestCloakRelease = {
    version: getCloakAppVersion(),
    downloadUrl: getCloakDownloadUrl(),
    publishedAt: null,
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      },
    )
    if (!res.ok) return fallback

    const data = (await res.json()) as {
      tag_name?: string
      published_at?: string
      assets?: { name: string; browser_download_url: string }[]
    }

    const assets = data.assets ?? []
    const exe =
      assets.find((a) => a.name === CLOAK_RELEASE_EXE) ||
      assets.find((a) => /^Cloak.*\.exe$/i.test(a.name) && !a.name.includes('__')) ||
      assets.find((a) => /\.exe$/i.test(a.name))

    const version = (data.tag_name || '').replace(/^v/i, '') || fallback.version

    return {
      version,
      downloadUrl: exe?.browser_download_url || fallback.downloadUrl,
      publishedAt: data.published_at ?? null,
    }
  } catch {
    return fallback
  }
}
