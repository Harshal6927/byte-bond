import { Navbar } from "@/components/navbar"
import { useUser } from "@/components/user-context"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = useUser()

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-3xl">⚠️</div>
          <h2 className="mb-2 font-semibold text-foreground text-xl">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
