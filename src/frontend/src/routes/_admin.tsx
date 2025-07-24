import { Navbar } from "@/components/navbar"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/components/user-context"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = useUser()

  if (!user) {
    return <Skeleton className="flex min-h-screen items-center justify-center">Authenticating...</Skeleton>
  }

  if (!user.is_admin) {
    return <div className="flex min-h-screen items-center justify-center">Access Denied</div>
  }

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}
