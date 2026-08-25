import { app, ipcMain, shell } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater'
import updater from 'electron-updater'

const autoUpdater = updater.autoUpdater
let cancellationToken = new updater.CancellationToken()
let isDownloading = false
let handlersRegistered = false
let checkTimer: NodeJS.Timeout | null = null
let lastDownloadedFile: string | null = null

const UPDATE_FEED = {
  provider: 'github' as const,
  owner: 'realcaps04',
  repo: 'Cloak',
}

function isPortableRuntime() {
  return Boolean(process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR)
}

function ensureAppUpdateYml() {
  try {
    const dest = path.join(process.resourcesPath, 'app-update.yml')
    if (fs.existsSync(dest)) return
    fs.writeFileSync(
      dest,
      [
        'provider: github',
        'owner: realcaps04',
        'repo: Cloak',
        'updaterCacheDirName: cloak-updater',
        '',
      ].join('\n'),
      'utf8',
    )
  } catch (error) {
    console.warn('[cloak] Could not write app-update.yml:', error)
  }
}

function configureUpdater() {
  ensureAppUpdateYml()
  autoUpdater.setFeedURL(UPDATE_FEED)
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false
}

function sendAvailability(win: Electron.BrowserWindow, update: boolean, newVersion?: string) {
  if (win.isDestroyed()) return
  win.webContents.send('update-can-available', {
    update,
    version: app.getVersion(),
    newVersion,
  })
}

function installDownloadedUpdate() {
  const file = lastDownloadedFile
  if (file && fs.existsSync(file)) {
    // Portable / generic packages: launch the downloaded build, then exit.
    const child = spawn(file, [], {
      detached: true,
      stdio: 'ignore',
      shell: false,
    })
    child.unref()
    setTimeout(() => app.quit(), 400)
    return true
  }

  autoUpdater.quitAndInstall(false, true)
  return true
}

export function update(win: Electron.BrowserWindow) {
  configureUpdater()

  autoUpdater.removeAllListeners('checking-for-update')
  autoUpdater.removeAllListeners('update-available')
  autoUpdater.removeAllListeners('update-not-available')
  autoUpdater.removeAllListeners('error')
  autoUpdater.removeAllListeners('update-downloaded')

  autoUpdater.on('checking-for-update', () => {
    console.log('[cloak] Checking for updates…')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[cloak] Update available:', info.version)
    sendAvailability(win, true, info.version)
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[cloak] Up to date. Remote:', info.version)
    sendAvailability(win, false, info.version)
  })

  autoUpdater.on('error', (error: Error) => {
    console.error('[cloak] Updater error:', error.message)
    if (!win.isDestroyed()) {
      win.webContents.send('update-error', {
        message: error?.message || 'Update check failed',
        error,
      })
    }
  })

  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    lastDownloadedFile = event.downloadedFile || null
    console.log('[cloak] Update downloaded:', event.version, lastDownloadedFile)
    if (!win.isDestroyed()) {
      win.webContents.send('update-downloaded')
    }
  })

  if (!handlersRegistered) {
    handlersRegistered = true

    ipcMain.handle('check-update', async () => {
      if (!app.isPackaged) {
        const error = new Error('Updates are only available in the installed Cloak Desktop app.')
        return { message: error.message, error }
      }

      try {
        configureUpdater()
        const result = await autoUpdater.checkForUpdates()
        return {
          updateInfo: result?.updateInfo ?? null,
          portable: isPortableRuntime(),
        }
      } catch (error) {
        const resolvedError = error instanceof Error ? error : new Error('Network error')
        return { message: resolvedError.message, error: resolvedError }
      }
    })

    ipcMain.handle('start-download', (event: Electron.IpcMainInvokeEvent) => {
      if (isDownloading) return { ok: false as const, message: 'Download already in progress.' }

      isDownloading = true
      startDownload(
        (error, progressInfo) => {
          if (error) {
            isDownloading = false
            event.sender.send('update-error', { message: error.message, error })
          } else if (progressInfo) {
            event.sender.send('download-progress', progressInfo)
          }
        },
        (downloaded) => {
          isDownloading = false
          lastDownloadedFile = downloaded.downloadedFile || lastDownloadedFile
          event.sender.send('update-downloaded')
        },
      )
      return { ok: true as const }
    })

    ipcMain.handle('cancel-download', () => {
      cancellationToken.cancel()
      cancellationToken = new updater.CancellationToken()
      isDownloading = false
      return { ok: true as const }
    })

    ipcMain.handle('quit-and-install', async () => {
      try {
        installDownloadedUpdate()
        return { ok: true as const, portable: isPortableRuntime() }
      } catch (error) {
        console.error('[cloak] Install failed:', error)
        void shell.openExternal(
          `https://github.com/${UPDATE_FEED.owner}/${UPDATE_FEED.repo}/releases/latest`,
        )
        return {
          ok: false as const,
          portable: isPortableRuntime(),
          message: error instanceof Error ? error.message : 'Install failed',
        }
      }
    })

    ipcMain.handle('cloak:get-app-version', () => app.getVersion())
    ipcMain.handle('cloak:update-runtime-info', () => ({
      packaged: app.isPackaged,
      portable: isPortableRuntime(),
      version: app.getVersion(),
    }))
  }

  const runCheck = () => {
    if (!app.isPackaged || win.isDestroyed()) return
    void autoUpdater.checkForUpdates().catch((error: Error) => {
      console.warn('[cloak] Background update check failed:', error.message)
    })
  }

  runCheck()
  if (checkTimer) clearInterval(checkTimer)
  checkTimer = setInterval(runCheck, 6 * 60 * 60 * 1000)

  win.on('closed', () => {
    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  })
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  const onDownloadProgress = (info: ProgressInfo) => callback(null, info)
  const onError = (error: Error) => {
    cleanup()
    callback(error, null)
  }
  const onDownloaded = (event: UpdateDownloadedEvent) => {
    cleanup()
    complete(event)
  }

  const cleanup = () => {
    autoUpdater.off('download-progress', onDownloadProgress)
    autoUpdater.off('error', onError)
    autoUpdater.off('update-downloaded', onDownloaded)
  }

  autoUpdater.on('download-progress', onDownloadProgress)
  autoUpdater.on('error', onError)
  autoUpdater.once('update-downloaded', onDownloaded)
  void autoUpdater.downloadUpdate(cancellationToken).catch((error: Error) => {
    cleanup()
    callback(error, null)
  })
}
