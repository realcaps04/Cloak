const fs = require('node:fs')
const path = require('node:path')

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
}
