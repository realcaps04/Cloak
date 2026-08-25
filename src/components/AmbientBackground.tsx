export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="animate-drift absolute -left-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.14),transparent_68%)] blur-2xl" />
      <div className="animate-drift absolute -bottom-32 -right-20 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(20,80,50,0.18),transparent_70%)] blur-2xl [animation-delay:-4s]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,7,0.15),rgba(5,6,7,0.94))]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
