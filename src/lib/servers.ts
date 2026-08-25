export type CloakServer = {
  id: string
  name: string
  tagline: string
  players: number
  maxPlayers: number
  ping: number
  status: 'online' | 'maintenance' | 'offline'
  region: string
  protected: boolean
}

/** Populated from your backend later — empty for now. */
export const CLOAK_SERVERS: CloakServer[] = []
