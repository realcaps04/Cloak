import { shell } from 'electron'

const SERVER_ENDPOINTS: Record<string, string> = {
  'cloak-main': 'fivem://connect/cfx.re/join/cloak-main-beta',
  'cloak-dev': 'fivem://connect/cfx.re/join/cloak-dev-beta',
  'cloak-events': 'fivem://connect/cfx.re/join/cloak-events-beta',
}

export async function joinProtectedServer(serverId: string) {
  const endpoint = SERVER_ENDPOINTS[serverId]
  if (!endpoint) {
    return { ok: false as const, message: 'Server not found.' }
  }

  // Beta: real endpoints will come from your backend so IPs never touch the UI.
  await shell.openExternal(endpoint)

  return {
    ok: true as const,
    message: 'Launching FiveM through Cloak — your join link stays inside the app.',
  }
}
