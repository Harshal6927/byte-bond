import { Navbar } from "@/components/navbar"
import { useUser } from "@/components/user-context"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  const { user } = useUser()

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
          <p className="text-slate-300">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <main className="pb-safe">
        <Outlet />
      </main>
    </div>
  )
}
