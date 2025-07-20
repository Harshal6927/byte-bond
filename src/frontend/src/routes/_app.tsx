import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/components/user-context"
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  const { user, logout } = useUser()

  if (!user) {
    return <Skeleton className="flex min-h-screen items-center justify-center">Authenticating...</Skeleton>
  }

  return (
    <>
      <nav>Nav</nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}
