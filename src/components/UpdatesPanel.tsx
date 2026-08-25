import { useCallback, useEffect, useState } from 'react'

type UpdateAvailability = {
  update: boolean
  version: string
  newVersion?: string
}

type DownloadProgress = {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
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

export function UpdatesPanel({
  updateAvailable,
  onAvailability,
}: {
  updateAvailable: boolean
  onAvailability: (available: boolean, info?: UpdateAvailability) => void
}) {
  const [currentVersion, setCurrentVersion] = useState('…')
  const [info, setInfo] = useState<UpdateAvailability | null>(null)
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUpdater, setHasUpdater] = useState(false)
  const [portable, setPortable] = useState(false)

  const applyAvailability = useCallback(
    (next: UpdateAvailability) => {
      setInfo(next)
      onAvailability(next.update, next)
    },
    [onAvailability],
  )

  const checkForUpdates = useCallback(async () => {
    const api = window.cloak
    if (!api?.checkForUpdates) {
      setError('Updates are only available in the installed Cloak Desktop app.')
      return
    }

    setChecking(true)
    setError(null)
    setDownloaded(false)
    setProgress(null)

    try {
      const result = await api.checkForUpdates()
      if (result && 'portable' in result && typeof result.portable === 'boolean') {
        setPortable(result.portable)
      }
      if (result && 'error' in result && result.error) {
        setError(result.message || 'Could not check for updates.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check for updates.')
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const api = window.cloak
    setHasUpdater(Boolean(api?.checkForUpdates))
    if (!api) return

    void api.getAppVersion?.().then(setCurrentVersion).catch(() => setCurrentVersion('unknown'))
    void api.getUpdateRuntimeInfo?.().then((runtime) => setPortable(runtime.portable))

    const offAvailable = api.onUpdateAvailable?.((payload) => {
      applyAvailability(payload)
      if (!payload.update) {
        setDownloaded(false)
        setProgress(null)
      }
    })
    const offProgress = api.onDownloadProgress?.((payload) => {
      setDownloading(true)
      setProgress(payload)
    })
    const offDownloaded = api.onUpdateDownloaded?.(() => {
      setDownloading(false)
      setDownloaded(true)
      setProgress((prev) => (prev ? { ...prev, percent: 100 } : { percent: 100, transferred: 0, total: 0, bytesPerSecond: 0 }))
    })
    const offError = api.onUpdateError?.((payload) => {
      setDownloading(false)
      setInstalling(false)
      setError(payload.message || 'Update failed.')
    })

    void checkForUpdates()

    return () => {
      offAvailable?.()
      offProgress?.()
      offDownloaded?.()
      offError?.()
    }
  }, [applyAvailability, checkForUpdates])

  const available = info?.update ?? updateAvailable

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

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-snow">Updates</h2>
        <p className="mt-1 text-sm text-mist">
          When a new Cloak Desktop release is published, it appears here. Download it in-app, then
          install and relaunch.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-panel/50 p-6 panel-glow">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-mist uppercase">Installed</p>
            <p className="mt-1 font-display text-2xl font-bold text-snow">v{currentVersion}</p>
            <p className="mt-1 text-xs text-mist">Cloak Desktop · checks GitHub Releases automatically</p>
          </div>
          <button
            type="button"
            onClick={() => void checkForUpdates()}
            disabled={checking || downloading || installing}
            className="no-drag rounded-full border border-line px-4 py-2 text-sm font-semibold text-mist transition hover:border-signal/40 hover:text-snow disabled:opacity-60"
          >
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        {!error && available && info?.newVersion ? (
          <div className="mt-6 rounded-xl border border-signal/30 bg-signal/10 px-4 py-4">
            <p className="text-sm font-semibold text-signal">Update available</p>
            <p className="mt-1 text-sm text-mist">
              Version <span className="font-semibold text-snow">v{info.newVersion}</span> is ready.
              Download inside Cloak Desktop, then install and relaunch.
            </p>

            {progress ? (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-mist">
                  <span>
                    {downloading
                      ? 'Downloading package…'
                      : downloaded
                        ? 'Package ready'
                        : 'Progress'}
                  </span>
                  <span>
                    {Math.round(progress.percent)}%
                    {progress.total > 0
                      ? ` · ${formatBytes(progress.transferred)} / ${formatBytes(progress.total)}`
                      : ''}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full bg-signal transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              {!downloaded ? (
                <button
                  type="button"
                  disabled={downloading || installing}
                  onClick={() => void startDownload()}
                  className="no-drag rounded-full bg-signal px-4 py-2 text-sm font-bold text-void transition hover:bg-signal-bright disabled:opacity-60"
                >
                  {downloading ? 'Downloading…' : 'Download update'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={installing}
                  onClick={() => void installAndRelaunch()}
                  className="no-drag rounded-full bg-signal px-4 py-2 text-sm font-bold text-void transition hover:bg-signal-bright disabled:opacity-60"
                >
                  {installing ? 'Relaunching…' : 'Install and relaunch'}
                </button>
              )}
              {downloading ? (
                <button
                  type="button"
                  onClick={() => {
                    void window.cloak?.cancelUpdateDownload?.()
                    setDownloading(false)
                  }}
                  className="no-drag rounded-full border border-line px-4 py-2 text-sm font-semibold text-mist transition hover:border-snow/20 hover:text-snow"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {portable ? (
              <p className="mt-3 text-xs text-mist">
                Tip: use the installed Cloak Desktop setup (not the portable .exe) for the smoothest
                install-and-relaunch flow.
              </p>
            ) : null}
          </div>
        ) : null}

        {!error && !available && info && !checking ? (
          <p className="mt-6 text-sm text-mist">Cloak Desktop is up to date.</p>
        ) : null}

        {!hasUpdater ? (
          <p className="mt-6 text-sm text-mist">
            Open the installed Cloak Desktop app to download and install updates from GitHub
            Releases.
          </p>
        ) : null}
      </div>
    </section>
  )
}
