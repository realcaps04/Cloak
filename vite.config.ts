import { copyFileSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { electronSimple } from 'vite-plugin-electron/multi-env'
import { notBundle } from 'vite-plugin-electron/plugin'
import pkg from './package.json'

const external = Object.keys(
  'dependencies' in pkg ? (pkg.dependencies as Record<string, string>) : {},
)

/** notBundle emits require() but Vite names the file .mjs — Electron then skips preload. */
function fixPreloadCjs(): Plugin {
  const preloadDir = path.resolve('dist-electron/preload')
  return {
    name: 'cloak-fix-preload-cjs',
    applyToEnvironment(environment) {
      return environment.name.includes('preload')
    },
    closeBundle() {
      const mjs = path.join(preloadDir, 'index.mjs')
      const cjs = path.join(preloadDir, 'index.cjs')
      if (!existsSync(mjs)) return
      copyFileSync(mjs, cjs)
      rmSync(mjs, { force: true })
      console.log('[cloak] Preload written as index.cjs')
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const webOnly = mode === 'web'
  const isAdmin = mode === 'admin'

  // Ensure Electron main inherits admin role (single-instance / userData / auth port).
  if (isAdmin) {
    process.env.CLOAK_APP_ROLE = 'admin'
    process.env.VITE_CLOAK_APP_ROLE = 'admin'
  }

  if (!webOnly) {
    rmSync('dist-electron', { recursive: true, force: true })
  }

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    base: webOnly ? '/' : './',
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    define: isAdmin
      ? {
          'import.meta.env.VITE_CLOAK_APP_ROLE': JSON.stringify('admin'),
        }
      : undefined,
    plugins: [
      react(),
      tailwindcss(),
      ...(webOnly
        ? []
        : [
            electronSimple({
              main: {
                input: 'electron/main/index.ts',
                plugins: [notBundle()],
                vite: {
                  define: {
                    'process.env.CLOAK_APP_ROLE': JSON.stringify(isAdmin ? 'admin' : 'user'),
                    'process.env.VITE_CLOAK_APP_ROLE': JSON.stringify(isAdmin ? 'admin' : 'user'),
                  },
                },
                options: {
                  build: {
                    sourcemap,
                    minify: isBuild,
                    outDir: 'dist-electron/main',
                    rolldownOptions: {
                      external,
                    },
                  },
                },
              },
              preload: {
                input: 'electron/preload/index.ts',
                plugins: [notBundle(), fixPreloadCjs()],
                options: {
                  build: {
                    sourcemap: sourcemap ? 'inline' : undefined,
                    minify: isBuild,
                    outDir: 'dist-electron/preload',
                    rolldownOptions: {
                      external: [...external, 'electron'],
                    },
                  },
                },
              },
            }),
          ]),
    ],
    clearScreen: false,
  }
})
