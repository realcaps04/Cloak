export function FeatureTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-line bg-panel/70 px-3 py-1 text-[11px] font-medium tracking-wide text-mist">
      {label}
    </span>
  )
}
