type BetaBadgeProps = {
  size?: 'sm' | 'md'
  className?: string
}

export function BetaBadge({ size = 'sm', className = '' }: BetaBadgeProps) {
  const sizeClass =
    size === 'md'
      ? 'px-2.5 py-1 text-[11px] tracking-[0.18em]'
      : 'px-2 py-0.5 text-[10px] tracking-[0.22em]'

  return (
    <span
      className={`inline-flex items-center rounded-md border border-signal/35 bg-signal/10 font-semibold text-signal uppercase ${sizeClass} ${className}`}
    >
      Beta
    </span>
  )
}
