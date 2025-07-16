import { ThemeProvider } from "@/components/theme-context.tsx"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UserProvider } from "@/components/user-context"
import { Outlet, createRootRoute } from "@tanstack/react-router"

export const Route = createRootRoute({
  component: () => (
    <>
      <ThemeProvider>
        <UserProvider>
          <TooltipProvider>
            <Outlet />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </>
  ),
})
