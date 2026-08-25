import { GoogleAuthProvider, useGoogleAuth } from '@/web/GoogleAuthContext'
import { LandingBackground } from '@/web/LandingBackground'
import { WebsiteHome } from '@/web/WebsiteHome'

function WebsiteShell() {
  const { loading } = useGoogleAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-snow/10 border-t-signal" />
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-y-auto bg-void text-snow">
      <LandingBackground />
      <WebsiteHome />
    </div>
  )
}

export function WebsiteApp() {
  return (
    <GoogleAuthProvider>
      <WebsiteShell />
    </GoogleAuthProvider>
  )
}
