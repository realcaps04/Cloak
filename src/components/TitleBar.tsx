import { isAdminApp } from '@/lib/app-role'

export function TitleBar() {
  const admin = isAdminApp()
  return (
    <header className="drag-region relative z-20 flex h-9 items-center justify-between px-4">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-mist/80 uppercase">
        {admin ? 'Cloak Admin' : 'Cloak Desktop'}
      </p>
      <p className={`text-[10px] tracking-wide ${admin ? 'text-warn/80' : 'text-mist/70'}`}>
        {admin ? 'Connect Players at your Desire' : 'Join without leaking IPs'}
      </p>
    </header>
  )
}
