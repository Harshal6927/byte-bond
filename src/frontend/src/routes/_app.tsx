import { Link, Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  return (
    <>
      <nav>
        <Link to="/login">Login</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}
