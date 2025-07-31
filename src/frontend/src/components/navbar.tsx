import { useTheme } from "@/components/theme-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"
import { useUser } from "@/components/user-context"
import { Link } from "@tanstack/react-router"
import { ChartBarDecreasing, LogOut, Menu, Moon, ShieldUser, Sun } from "lucide-react"

export function Navbar() {
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()

  if (!user) {
    return null
  }

  const isAdminPage = window.location.pathname.startsWith("/_admin") || window.location.pathname.includes("/manage") || window.location.pathname.includes("/leaderboard")

  return (
    <nav className="border-border border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                <span className="font-bold text-sm text-white">B</span>
              </div>
              <span className="ml-2 bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text font-bold text-transparent text-xl">ByteBond</span>
            </div>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle - Only show on admin pages */}
            {isAdminPage && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* User Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 font-semibold text-sm text-white">
                          {user.name.at(0)?.toUpperCase()}
                          {user.name.at(-1)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden text-left sm:block">
                        <div className="font-medium text-foreground text-sm">{user.name}</div>
                        <div className="text-muted-foreground text-xs">{user.is_admin ? "Administrator" : "Participant"}</div>
                      </div>
                      <Menu className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 border-border bg-background">
                      <div className="px-3 py-2">
                        <p className="font-medium text-foreground text-sm">{user.name}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                      <div className="border-border border-t" />
                      <div className="py-1">
                        {user.is_admin && (
                          <>
                            <Link to="/manage">
                              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-foreground hover:bg-accent">
                                <ShieldUser className="h-4 w-4" />
                                Admin Panel
                              </Button>
                            </Link>
                            <Link to="/leaderboard">
                              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-foreground hover:bg-accent">
                                <ChartBarDecreasing className="h-4 w-4" />
                                Leaderboard
                              </Button>
                            </Link>
                            <div className="my-1 border-border border-t" />
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2 text-foreground hover:bg-accent">
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
