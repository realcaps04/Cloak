import cloakAppIcon from '@/assets/cloak_app_icon.png'
import cloakMarkIcon from '@/assets/cloak-icon.png'
import cloakBrand from '@/assets/cloak-brand.jpg'

/** Bundled assets — work in Electron file:// and on the website. */
export const CLOAK_ICON_SRC = cloakMarkIcon
export const CLOAK_APP_ICON_SRC = cloakAppIcon
export const CLOAK_BRAND_SRC = cloakBrand

type CloakIconProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Full branded app icon (default for chrome). */
  variant?: 'mark' | 'app'
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

/** App / shield mark — used in sidebar and chrome. */
export function CloakIcon({ size = 'md', className = '', variant = 'app' }: CloakIconProps) {
  const src = variant === 'mark' ? CLOAK_ICON_SRC : CLOAK_APP_ICON_SRC
  return (
    <div
      className={`relative ${iconSizes[size]} shrink-0 overflow-hidden rounded-xl shadow-[0_0_28px_rgba(34,197,94,0.22)] ${className}`}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

type CloakBrandProps = {
  className?: string
}

/** Full logo with Cloak wordmark — opening / preview screen only. */
export function CloakBrand({ className = '' }: CloakBrandProps) {
  return (
    <img
      src={CLOAK_BRAND_SRC}
      alt="Cloak"
      className={`h-28 w-auto max-w-[min(100%,18rem)] object-contain object-left ${className}`}
    />
  )
}
