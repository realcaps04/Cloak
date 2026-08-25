export function TitleBar() {
  return (
    <header className="drag-region relative z-20 flex h-9 items-center px-4">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-mist uppercase">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
        Cloak
      </div>
    </header>
  )
}
