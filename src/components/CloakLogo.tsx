export const CLOAK_ICON_SRC = '/cloak-icon.png'
export const CLOAK_BRAND_SRC = '/cloak-brand.jpg'

type CloakIconProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

/** Shield mark only — used in app chrome, sidebar, favicon, taskbar. */
export function CloakIcon({ size = 'md', className = '' }: CloakIconProps) {
  return (
    <div
      className={`relative ${iconSizes[size]} shrink-0 overflow-hidden rounded-xl shadow-[0_0_28px_rgba(34,197,94,0.22)] ${className}`}
    >
      <img src={CLOAK_ICON_SRC} alt="" className="h-full w-full object-contain" />
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
