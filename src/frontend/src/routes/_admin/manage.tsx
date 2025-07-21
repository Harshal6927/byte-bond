import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

function ManagePage() {
  return <div>Hello "/_admin/manage"!</div>
}
