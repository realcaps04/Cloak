import { useState } from 'react'
import type { CloakServer } from '@/lib/servers'

type ServerCardProps = {
  server: CloakServer
  onJoin: (serverId: string) => Promise<{ ok: boolean; message: string }>
}

function StatusDot({ status }: { status: CloakServer['status'] }) {
  const color =
    status === 'online' ? 'bg-signal' : status === 'maintenance' ? 'bg-warn' : 'bg-mist/40'
  return <span className={`h-2 w-2 rounded-full ${color} ${status === 'online' ? 'animate-pulse-soft' : ''}`} />
}

export function ServerCard({ server, onJoin }: ServerCardProps) {
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canJoin = server.status === 'online'

  async function handleJoin() {
    if (!canJoin || joining) return
    setJoining(true)
    setMessage(null)
    try {
      const result = await onJoin(server.id)
      setMessage(result.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-panel/60 p-5 transition hover:border-signal/25 hover:bg-panel/90">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-signal/8 blur-2xl transition group-hover:bg-signal/14" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusDot status={server.status} />
            <h3 className="truncate font-display text-lg font-semibold text-snow">{server.name}</h3>
            {server.protected && (
              <span className="rounded-md bg-signal/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-signal uppercase">
                Protected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-mist">{server.tagline}</p>
        </div>

        <div className="text-right text-xs text-mist">
          <div className="font-medium text-snow">
            {server.status === 'online' ? `${server.players}/${server.maxPlayers}` : '—'}
          </div>
          <div className="mt-0.5">
            {server.status === 'online' ? `${server.ping}ms · ${server.region}` : server.status}
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <button
          type="button"
          disabled={!canJoin || joining}
          onClick={() => void handleJoin()}
          className="no-drag inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-void transition hover:bg-signal-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {joining ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/20 border-t-void" />
              Connecting…
            </>
          ) : canJoin ? (
            'Join server'
          ) : (
            'Unavailable'
          )}
        </button>
      </div>

      {message && (
        <p className="relative mt-3 text-xs leading-relaxed text-signal-dim">{message}</p>
      )}
    </article>
  )
}
