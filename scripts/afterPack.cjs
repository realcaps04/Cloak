const fs = require('node:fs')
const path = require('node:path')

/** Ensure electron-updater can find publish config (portable skips this otherwise). */
exports.default = async function afterPack(context) {
  const yml = [
    'provider: github',
    'owner: realcaps04',
    'repo: Cloak',
    'updaterCacheDirName: cloak-updater',
    '',
  ].join('\n')

  const dest = path.join(context.appOutDir, 'resources', 'app-update.yml')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, yml, 'utf8')
  console.log('[cloak] Wrote', dest)
}
