import { useEffect, useState } from 'react'
import type { CloakServer } from '@/lib/servers'

type ServerCardProps = {
  server: CloakServer
  onJoin: (serverId: string) => Promise<{ ok: boolean; message: string }>
}

function StatusDot({ status }: { status: CloakServer['status'] }) {
  const color =
    status === 'online' ? 'bg-signal' : status === 'maintenance' ? 'bg-warn' : 'bg-mist/40'
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${color} ${
        status === 'online' ? 'animate-pulse-soft' : ''
      }`}
    />
  )
}

/** Sample a few pixels from the server icon for a matching card tint. */
function useIconAccent(iconUrl?: string | null) {
  const [accent, setAccent] = useState('34, 197, 94')

  useEffect(() => {
    if (!iconUrl) {
      setAccent('34, 197, 94')
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 16) {
          const a = data[i + 3]
          if (a < 40) continue
          const pr = data[i]
          const pg = data[i + 1]
          const pb = data[i + 2]
          // Skip near-black / near-white so accents stay vivid.
          const max = Math.max(pr, pg, pb)
          const min = Math.min(pr, pg, pb)
          if (max < 28 || min > 230) continue
          r += pr
          g += pg
          b += pb
          count += 1
        }
        if (!cancelled && count > 0) {
          setAccent(
            `${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`,
          )
        }
      } catch {
        // CORS / tainted canvas — keep default signal green.
      }
    }
    img.onerror = () => {
      if (!cancelled) setAccent('34, 197, 94')
    }
    img.src = iconUrl
    return () => {
      cancelled = true
    }
  }, [iconUrl])

  return accent
}

export function ServerCard({ server, onJoin }: ServerCardProps) {
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canJoin = server.status === 'online'
  const accent = useIconAccent(server.iconUrl)

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
    <article
      className="group relative min-w-0 overflow-hidden rounded-xl border border-line/80 p-3.5 transition hover:border-white/15 sm:min-w-[18rem]"
      style={{
        background: `linear-gradient(145deg, rgba(${accent}, 0.22) 0%, rgba(10, 12, 14, 0.92) 55%, rgba(7, 8, 9, 0.98) 100%)`,
        boxShadow: `inset 0 1px 0 rgba(${accent}, 0.18)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl transition group-hover:opacity-90"
        style={{ background: `rgba(${accent}, 0.28)` }}
        aria-hidden
      />

      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-ink/70"
          style={{ boxShadow: `0 0 18px rgba(${accent}, 0.25)` }}
        >
          {server.iconUrl ? (
            <img
              src={server.iconUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="font-display text-sm font-bold text-snow/80">
              {server.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <StatusDot status={server.status} />
            <h3 className="truncate font-display text-sm font-semibold text-snow">{server.name}</h3>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-mist">
            {server.status === 'online'
              ? `${server.region} · protected`
              : `${server.status} · ${server.region}`}
          </p>
        </div>

        <button
          type="button"
          disabled={!canJoin || joining}
          onClick={() => void handleJoin()}
          className="no-drag shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-void transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: canJoin ? `rgb(${accent})` : 'rgba(139, 147, 158, 0.35)',
          }}
        >
          {joining ? '…' : canJoin ? 'Join' : 'Off'}
        </button>
      </div>

      {message ? (
        <p className="relative mt-2 text-[11px] leading-relaxed text-mist">{message}</p>
      ) : null}
    </article>
  )
}
