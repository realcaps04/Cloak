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

export const BETA_SERVERS: CloakServer[] = [
  {
    id: 'cloak-main',
    name: 'Cloak City RP',
    tagline: 'Primary protected server',
    players: 42,
    maxPlayers: 128,
    ping: 28,
    status: 'online',
    region: 'EU',
    protected: true,
  },
  {
    id: 'cloak-dev',
    name: 'Cloak Dev Sandbox',
    tagline: 'Beta testing environment',
    players: 6,
    maxPlayers: 32,
    ping: 31,
    status: 'online',
    region: 'EU',
    protected: true,
  },
  {
    id: 'cloak-events',
    name: 'Cloak Events',
    tagline: 'Weekend pop-up sessions',
    players: 0,
    maxPlayers: 64,
    ping: 0,
    status: 'maintenance',
    region: 'EU',
    protected: true,
  },
]
