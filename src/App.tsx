import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AmbientBackground } from '@/components/AmbientBackground'
import { TitleBar } from '@/components/TitleBar'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { isElectronApp } from '@/lib/web'
import { WebsiteApp } from '@/web/WebsiteApp'

function DesktopShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-snow/10 border-t-signal" />
      </div>
    )
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-void text-snow">
      <AmbientBackground />
      <TitleBar />
      <div className="relative min-h-0 flex-1">
        {user ? <HomePage /> : <LoginPage />}
      </div>
    </div>
  )
}

export default function App() {
  if (!isElectronApp()) {
    return <WebsiteApp />
  }

  return (
    <AuthProvider>
      <DesktopShell />
    </AuthProvider>
  )
}
