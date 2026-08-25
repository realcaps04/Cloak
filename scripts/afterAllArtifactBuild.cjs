const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

/**
 * electron-builder skips latest.yml for portable targets.
 * Write it ourselves so electron-updater can download Cloak.exe in-app.
 */
exports.default = async function afterAllArtifactBuild(buildResult) {
  const outDir = buildResult.outDir
  const artifactPaths = buildResult.artifactPaths || []
  const exe =
    artifactPaths.find((p) => /[/\\]Cloak\.exe$/i.test(p)) || path.join(outDir, 'Cloak.exe')

  if (!fs.existsSync(exe)) {
    console.warn('[cloak] Cloak.exe not found; skipped latest.yml')
    return []
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  const data = fs.readFileSync(exe)
  const sha512 = crypto.createHash('sha512').update(data).digest('base64')
  const size = data.length
  const yml = [
    `version: ${pkg.version}`,
    'files:',
    '  - url: Cloak.exe',
    `    sha512: ${sha512}`,
    `    size: ${size}`,
    'path: Cloak.exe',
    `sha512: ${sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
    '',
  ].join('\n')

  const latestPath = path.join(outDir, 'latest.yml')
  fs.writeFileSync(latestPath, yml, 'utf8')
  console.log('[cloak] Wrote', latestPath)
  return [latestPath]
}
