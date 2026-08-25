const fs = require('node:fs')
const path = require('node:path')

const RUNTIME_KEYS = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_GUILD_ID',
  'DISCORD_GUILD_NAME',
  'DISCORD_INVITE_URL',
  'DISCORD_REDIRECT_URI',
  'DISCORD_ADMIN_REDIRECT_URI',
  'CONVEX_URL',
  'VITE_CONVEX_URL',
]

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, '')
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key) out[key] = value
  }
  return out
}

/**
 * Pack Discord + Convex secrets into the app so installed/portable builds
 * work without a project .env next to Cloak.exe.
 */
function writeRuntimeEnv(context) {
  const projectDir = context.packager?.projectDir || process.cwd()
  const fromFile = parseEnvFile(path.join(projectDir, '.env'))
  const lines = []

  for (const key of RUNTIME_KEYS) {
    const value = (process.env[key] || fromFile[key] || '').trim()
    if (!value) continue
    lines.push(`${key}=${value}`)
  }

  if (!lines.some((line) => line.startsWith('DISCORD_CLIENT_ID='))) {
    console.warn(
      '[cloak] DISCORD_CLIENT_ID missing while packing — login will fail in the release build. Check project .env',
    )
  }

  const dest = path.join(context.appOutDir, 'resources', 'cloak-runtime.env')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, `${lines.join('\n')}\n`, 'utf8')
  console.log('[cloak] Wrote', dest, `(${lines.length} keys)`)
}

/** Portable builds skip default app-update.yml; write a public generic feed instead. */
exports.default = async function afterPack(context) {
  const yml = [
    'provider: generic',
    'url: https://github.com/realcaps04/Cloak/releases/latest/download',
    'updaterCacheDirName: cloak-updater',
    '',
  ].join('\n')

  const dest = path.join(context.appOutDir, 'resources', 'app-update.yml')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, yml, 'utf8')
  console.log('[cloak] Wrote', dest)

  writeRuntimeEnv(context)

  const productName = context.packager?.appInfo?.productName || ''
  const role =
    process.env.CLOAK_APP_ROLE === 'admin' || /admin/i.test(productName) ? 'admin' : 'user'
  const rolePath = path.join(context.appOutDir, 'resources', 'app-role.json')
  fs.writeFileSync(rolePath, `${JSON.stringify({ role }, null, 2)}\n`, 'utf8')
  console.log('[cloak] Wrote', rolePath, `(${role})`)
}
