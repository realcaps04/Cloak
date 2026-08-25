/**
 * Join a protected FiveM server.
 * Endpoints will come from your backend later so IPs never touch the UI.
 */
export async function joinProtectedServer(serverId: string) {
  if (!serverId.trim()) {
    return { ok: false as const, message: 'Server not found.' }
  }

  return {
    ok: false as const,
    message: 'No servers are available yet. Check back soon.',
  }
}
