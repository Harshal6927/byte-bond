import { Button } from "@/components/ui/button"
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu"
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
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink>
              <Link to="/dashboard">
                <Button type="button" variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink>
              <Button type="button" variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <main>
        <Outlet />
      </main>
    </>
  )
}
