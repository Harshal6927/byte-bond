import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"
import { useUser } from "@/components/user-context"
import { Link } from "@tanstack/react-router"
import { ChartBarDecreasing, LogOut, ShieldUser } from "lucide-react"

export function Navbar() {
  const { user, logout } = useUser()

  if (!user) {
    return null
  }

  return (
    <NavigationMenu className="gap-2 p-2">
      {/* <NavigationMenuList>
        <NavigationMenuItem>
          <Link to="/dashboard">
            <Button type="button" variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList> */}

      <NavigationMenuList>
        <NavigationMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
              </Avatar>
              <div className="font-medium text-sm leading-none">{user.name}</div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="flex flex-col gap-1">
                {user.is_admin && (
                  <>
                    <Link to="/manage">
                      <Button type="button" variant="ghost" size="sm" className="justify-start gap-2">
                        <ShieldUser />
                        Admin
                      </Button>
                    </Link>
                    <Link to="/leaderboard">
                      <Button type="button" variant="ghost" size="sm" className="justify-start gap-2">
                        <ChartBarDecreasing />
                        Leaderboard
                      </Button>
                    </Link>
                  </>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={logout} className="justify-start gap-2">
                  <LogOut />
                  Logout
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
