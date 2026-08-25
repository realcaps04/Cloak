/// <reference types="vite/client" />

import type { CloakApi } from './lib/types'

declare global {
  interface Window {
    cloak?: CloakApi
  }
}

export {}
