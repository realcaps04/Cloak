/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_CONVEX_URL?: string
  readonly VITE_CLOAK_DOWNLOAD_URL?: string
  readonly VITE_CLOAK_APP_VERSION?: string
}

declare module '*.md?raw' {
  const content: string
  export default content
}

import type { CloakApi } from './lib/types'

declare global {
  interface Window {
    cloak?: CloakApi
  }
}

export {}
