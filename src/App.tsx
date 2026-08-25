import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AmbientBackground } from '@/components/AmbientBackground'
import { TitleBar } from '@/components/TitleBar'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'

function Shell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-snow/10 border-t-signal" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-snow">
      <AmbientBackground />
      <TitleBar />
      {user ? <HomePage /> : <LoginPage />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
