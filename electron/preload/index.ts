import { ipcRenderer, contextBridge } from 'electron'

export type CloakUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
  discriminator: string
}

export type AuthResult =
  | { ok: true; user: CloakUser }
  | { ok: false; error: string }

const cloak = {
  minimize: () => ipcRenderer.invoke('cloak:window-minimize'),
  maximize: () => ipcRenderer.invoke('cloak:window-maximize'),
  close: () => ipcRenderer.invoke('cloak:window-close'),
  discordLogin: (): Promise<AuthResult> => ipcRenderer.invoke('cloak:discord-login'),
  isDiscordConfigured: (): Promise<boolean> => ipcRenderer.invoke('cloak:discord-configured'),
  onAuthResult: (callback: (result: AuthResult) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: AuthResult) => callback(result)
    ipcRenderer.on('cloak:auth-result', listener)
    return () => ipcRenderer.off('cloak:auth-result', listener)
  },
}

contextBridge.exposeInMainWorld('cloak', cloak)

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) resolve(true)
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child)
    }
  },
}

function useLoading() {
  const className = 'cloak-boot-loader'
  const styleContent = `
.${className} {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(232, 234, 237, 0.12);
  border-top-color: #7CFFB2;
  animation: cloak-spin 0.9s linear infinite;
}
@keyframes cloak-spin { to { transform: rotate(360deg); } }
.app-loading-wrap {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: #070809;
  z-index: 9999;
}
`
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')
  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)
window.onmessage = (ev) => {
  if (ev.data?.payload === 'removeLoading') removeLoading()
}
setTimeout(removeLoading, 4999)
