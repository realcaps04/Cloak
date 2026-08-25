import { useCallback, useEffect, useState } from 'react'
import { CloakIcon } from '@/components/CloakLogo'

type DownloadProgress = {
  percent: number
  transferred: number
  total: number
}

function formatBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = n
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Blocking update gate for installed builds — hard to miss, drives users to the newest release.
 */
export function ForceUpdateModal() {
  const [open, setOpen] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('…')
  const [newVersion, setNewVersion] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onAvailable = useCallback((update: boolean, version?: string) => {
    if (!update) {
      setOpen(false)
      setNewVersion(null)
      return
    }
    setNewVersion(version || null)
    setOpen(true)
  }, [])

  useEffect(() => {
    const api = window.cloak
    if (!api?.checkForUpdates) return

    void api.getAppVersion?.().then(setCurrentVersion).catch(() => setCurrentVersion('unknown'))

    const offAvailable = api.onUpdateAvailable?.((info) => {
      onAvailable(info.update, info.newVersion)
    })
    const offProgress = api.onDownloadProgress?.((payload) => {
      setDownloading(true)
      setProgress({
        percent: payload.percent,
        transferred: payload.transferred,
        total: payload.total,
      })
    })
    const offDownloaded = api.onUpdateDownloaded?.(() => {
      setDownloading(false)
      setDownloaded(true)
      setProgress((prev) => (prev ? { ...prev, percent: 100 } : { percent: 100, transferred: 0, total: 0 }))
    })
    const offError = api.onUpdateError?.((payload) => {
      setDownloading(false)
      setInstalling(false)
      setError(payload.message || 'Update failed.')
    })

    void api.checkForUpdates?.().catch(() => undefined)

    return () => {
      offAvailable?.()
      offProgress?.()
      offDownloaded?.()
      offError?.()
    }
  }, [onAvailable])

  if (!open) return null

  async function startDownload() {
    setError(null)
    setDownloading(true)
    setDownloaded(false)
    try {
      await window.cloak?.startUpdateDownload?.()
    } catch (err) {
      setDownloading(false)
      setError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  async function installAndRelaunch() {
    setInstalling(true)
    setError(null)
    try {
      await window.cloak?.quitAndInstall?.()
    } catch (err) {
      setInstalling(false)
      setError(err instanceof Error ? err.message : 'Could not start install.')
    }
  }

  function openWebsiteDownload() {
    void window.open(
      'https://github.com/realcaps04/Cloak/releases/latest/download/Cloak.exe',
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cloak-update-title"
      aria-describedby="cloak-update-body"
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-signal/50 bg-panel p-8 shadow-[0_0_80px_rgba(34,197,94,0.35)]">
        <div className="flex items-center gap-3">
          <CloakIcon size="md" />
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-signal uppercase">Required update</p>
            <h2 id="cloak-update-title" className="font-display text-2xl font-bold text-snow">
              Update Cloak Desktop now
            </h2>
          </div>
        </div>

        <p id="cloak-update-body" className="mt-4 text-sm leading-relaxed text-mist">
          You are on <span className="font-semibold text-snow">v{currentVersion}</span>. A newer
          build
          {newVersion ? (
            <>
              {' '}
              (<span className="font-semibold text-signal">v{newVersion}</span>)
            </>
          ) : null}{' '}
          is required for Discord sign-in fixes and the latest features. Update before you continue.
        </p>

        {progress ? (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-mist">
              <span>{downloaded ? 'Ready to install' : 'Downloading update…'}</span>
              <span>
                {Math.round(progress.percent)}%
                {progress.total > 0
                  ? ` · ${formatBytes(progress.transferred)} / ${formatBytes(progress.total)}`
                  : ''}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-signal transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3">
          {!downloaded ? (
            <button
              type="button"
              disabled={downloading || installing}
              onClick={() => void startDownload()}
              className="no-drag w-full rounded-full bg-signal px-5 py-3.5 text-sm font-bold text-void shadow-[0_0_28px_rgba(34,197,94,0.45)] transition hover:bg-signal-bright disabled:opacity-60"
            >
              {downloading ? 'Downloading…' : 'Download update now'}
            </button>
          ) : (
            <button
              type="button"
              disabled={installing}
              onClick={() => void installAndRelaunch()}
              className="no-drag w-full rounded-full bg-signal px-5 py-3.5 text-sm font-bold text-void shadow-[0_0_28px_rgba(34,197,94,0.45)] transition hover:bg-signal-bright disabled:opacity-60"
            >
              {installing ? 'Relaunching…' : 'Install and relaunch'}
            </button>
          )}

          <button
            type="button"
            onClick={openWebsiteDownload}
            className="no-drag w-full rounded-full border border-line px-5 py-3 text-sm font-semibold text-mist transition hover:border-snow/25 hover:text-snow"
          >
            Get Cloak.exe from the website
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-mist/70">
          After install, open the new Cloak Desktop and sign in with Discord again if asked.
        </p>
      </div>
    </div>
  )
}
