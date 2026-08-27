/**
 * Generate Microsoft Store AppX tile assets from Cloak's brand icon.
 * Fixes certification 10.1.1.11 (default Electron tile images).
 *
 * Usage: node scripts/generate-appx-assets.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const sourcePng = path.join(root, 'build', 'icon.png')
const outDir = path.join(root, 'build', 'appx')
const bg = '#0A0C0E'

if (!fs.existsSync(sourcePng)) {
  console.error('[cloak] Missing build/icon.png — cannot generate AppX tiles.')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const ps1 = `
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$srcPath = '${sourcePng.replace(/\\/g, '\\\\')}'
$outDir = '${outDir.replace(/\\/g, '\\\\')}'
$bg = [System.Drawing.ColorTranslator]::FromHtml('${bg}')
$src = [System.Drawing.Image]::FromFile($srcPath)

function Save-Square([int]$size, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($bg)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $pad = [Math]::Max(1, [int]($size * 0.06))
  $g.DrawImage($src, $pad, $pad, $size - 2 * $pad, $size - 2 * $pad)
  $g.Dispose()
  $dest = Join-Path $outDir $name
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $name ($size x $size)"
}

function Save-Wide([int]$w, [int]$h, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($bg)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $side = [Math]::Min($h - 12, [int]($w * 0.42))
  $x = [int](($w - $side) / 2)
  $y = [int](($h - $side) / 2)
  $g.DrawImage($src, $x, $y, $side, $side)
  $g.Dispose()
  $dest = Join-Path $outDir $name
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $name ($w x $h)"
}

# Required AppX logos (exact filenames electron-builder expects)
Save-Square 50 'StoreLogo.png'
Save-Square 44 'Square44x44Logo.png'
Save-Square 150 'Square150x150Logo.png'
Save-Wide 310 150 'Wide310x150Logo.png'

# Optional but recommended (avoids more default assets)
Save-Square 71 'SmallTile.png'
Save-Square 310 'LargeTile.png'
Save-Square 24 'BadgeLogo.png'
Save-Wide 620 300 'SplashScreen.png'

# Scale-200 variants (common Store / Start denser displays)
Save-Square 100 'StoreLogo.scale-200.png'
Save-Square 88 'Square44x44Logo.scale-200.png'
Save-Square 300 'Square150x150Logo.scale-200.png'
Save-Wide 620 300 'Wide310x150Logo.scale-200.png'
Save-Square 142 'SmallTile.scale-200.png'
Save-Square 620 'LargeTile.scale-200.png'

# Unplated Start-menu target sizes (prevents Electron fallback in search / taskbar)
foreach ($size in @(16, 24, 32, 48, 256)) {
  Save-Square $size ("Square44x44Logo.targetsize-$size" + '_altform-unplated.png')
  Save-Square $size ("Square44x44Logo.targetsize-$size" + '_altform-lightunplated.png')
}
Save-Square 44 'Square44x44Logo.targetsize-44_altform-unplated.png'
Save-Square 44 'Square44x44Logo.targetsize-44_altform-lightunplated.png'

$src.Dispose()
Write-Host 'AppX tile assets ready.'
`

const tmpPs1 = path.join(outDir, '_generate-appx-assets.ps1')
fs.writeFileSync(tmpPs1, ps1, 'utf8')
try {
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpPs1],
    { stdio: 'inherit' },
  )
} finally {
  try {
    fs.unlinkSync(tmpPs1)
  } catch {
    /* ignore */
  }
}

console.log('[cloak] AppX assets written to', outDir)
