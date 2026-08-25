export function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.22),transparent_68%)] blur-2xl" />
      <div className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(20,80,50,0.28),transparent_70%)] blur-2xl" />
      <div className="absolute -bottom-40 left-1/3 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.12),transparent_70%)] blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,7,0.2),rgba(5,6,7,0.92))]" />
    </div>
  )
}
