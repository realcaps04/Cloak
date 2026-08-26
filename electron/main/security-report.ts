import { makeFunctionReference } from 'convex/server'
import { ConvexHttpClient } from 'convex/browser'
import { restoreUserSession } from './convex-client'
import { loadStoredSessionToken } from './session-store'

const reportDesktopSecurityEventFn = makeFunctionReference<
  'mutation',
  {
    sessionToken: string
    eventType: 'f8' | 'copy'
    keyPressed?: string
    copiedText?: string
  },
  { ok: true; warningIds: string[]; count: number }
>('admin:reportDesktopSecurityEvent')

function getConvexUrl() {
  return (
    process.env.CONVEX_URL?.trim() ||
    process.env.VITE_CONVEX_URL?.trim() ||
    'https://sleek-shark-313.convex.cloud'
  )
}

function client() {
  return new ConvexHttpClient(getConvexUrl())
}

/**
 * Report a Desktop security event (F8 / copy) to admin Warnings for the
 * player's servers, then the caller may force-quit the app.
 */
export async function reportDesktopSecurityEvent(input: {
  eventType: 'f8' | 'copy'
  keyPressed?: string
  copiedText?: string
}) {
  const stored = loadStoredSessionToken()
  if (!stored?.token) {
    return { ok: false as const, error: 'Not signed in.' }
  }

  // Refresh session validity before reporting.
  const session = await restoreUserSession(stored.token)
  if (!session?.token) {
    return { ok: false as const, error: 'Session expired.' }
  }

  const result = await client().mutation(reportDesktopSecurityEventFn, {
    sessionToken: session.token,
    eventType: input.eventType,
    keyPressed: input.keyPressed,
    copiedText: input.copiedText?.slice(0, 500),
  })

  return { ok: true as const, ...result }
}
