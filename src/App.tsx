import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AmbientBackground } from '@/components/AmbientBackground'
import { ForceUpdateModal } from '@/components/ForceUpdateModal'
import { TitleBar } from '@/components/TitleBar'
import { LoginPage } from '@/pages/LoginPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { HomePage } from '@/pages/HomePage'
import { AdminHomePage } from '@/pages/AdminHomePage'
import { isAdminApp } from '@/lib/app-role'
import { isElectronApp } from '@/lib/web'
import { WebsiteApp } from '@/web/WebsiteApp'

function DesktopShell() {
  const { user, loading } = useAuth()
  const admin = isAdminApp()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-void">
        <div
          className={`h-10 w-10 animate-spin rounded-full border-2 border-snow/10 ${
            admin ? 'border-t-warn' : 'border-t-signal'
          }`}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden text-snow ${
        admin ? 'bg-[#070605]' : 'bg-void'
      }`}
    >
      <AmbientBackground variant={admin ? 'admin' : 'user'} />
      <TitleBar />
      <div className="relative min-h-0 flex-1">
        {user ? (
          admin ? (
            <AdminHomePage />
          ) : (
            <HomePage />
          )
        ) : admin ? (
          <AdminLoginPage />
        ) : (
          <LoginPage />
        )}
      </div>
      {!admin ? <ForceUpdateModal /> : null}
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
