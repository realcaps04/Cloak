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
  /** Public Convex storage URL for the server icon (never an IP/endpoint). */
  iconUrl?: string | null
}
