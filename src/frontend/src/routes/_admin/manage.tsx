import {
  type GetEvent,
  apiEventsEventIdDeleteEvent,
  apiEventsEventIdPatchEvent,
  apiEventsGetEvents,
  apiEventsPostEvent,
  apiGameStartStartGame,
  apiGameStopStopGame,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { CircleAlert, Edit, Eye, Gamepad2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

// Form schemas
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255, "Event name must be 255 characters or less"),
  code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
})

const editEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255, "Event name must be 255 characters or less"),
  code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
  is_active: z.boolean(),
  whitelist: z.string().refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, "Must be valid JSON"),
})

type CreateEventFormData = z.infer<typeof createEventSchema>
type EditEventFormData = z.infer<typeof editEventSchema>

function ManagePage() {
  const [events, setEvents] = useState<GetEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [eventsLoading, setEventsLoading] = useState(true)
  const [gameLoading, setGameLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form states
  const [selectedEventForAction, setSelectedEventForAction] = useState<GetEvent | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // React Hook Form instances
  const createForm = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      code: "",
    },
    mode: "onBlur",
  })

  const editForm = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      name: "",
      code: "",
      is_active: false,
      whitelist: "",
    },
    mode: "onBlur",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setEventsLoading(true)
    setError(null)

    try {
      const response = await apiEventsGetEvents()
      if (response.status === 200 && response.data) {
        setEvents(response.data.items || [])
      } else {
        setError("Failed to fetch events")
      }
    } catch (err) {
      setError("Failed to fetch events")
    }

    setEventsLoading(false)
  }

  const handleCreateEvent = async (data: CreateEventFormData) => {
    setFormLoading(true)
    try {
      const response = await apiEventsPostEvent({ body: data })
      if (response.status === 201) {
        await fetchEvents()
        setCreateDialogOpen(false)
        createForm.reset()
        toast.success("Event created successfully!")
      } else {
        toast.error("Failed to create event", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to create event")
    }
    setFormLoading(false)
  }

  const handleViewEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    setViewDialogOpen(true)
  }

  const handleEditEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    editForm.reset({
      name: event.name,
      code: event.code,
      is_active: event.is_active,
      whitelist: JSON.stringify(event.whitelist, null, 2),
    })
    setEditDialogOpen(true)
  }

  const handleUpdateEvent = async (data: EditEventFormData) => {
    if (!selectedEventForAction) return

    setFormLoading(true)
    try {
      const whitelistJson = JSON.parse(data.whitelist)
      const response = await apiEventsEventIdPatchEvent({
        path: { event_id: selectedEventForAction.id },
        body: {
          name: data.name,
          code: data.code,
          is_active: data.is_active,
          whitelist: whitelistJson,
        },
      })
      if (response.status === 200) {
        await fetchEvents()
        setEditDialogOpen(false)
        editForm.reset()
        setSelectedEventForAction(null)
        toast.success("Event updated successfully!")
      } else {
        toast.error("Failed to update event", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to update event")
    }
    setFormLoading(false)
  }

  const handleDeleteEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteEvent = async () => {
    if (!selectedEventForAction) return

    setFormLoading(true)
    try {
      const response = await apiEventsEventIdDeleteEvent({
        path: { event_id: selectedEventForAction.id },
      })
      if (response.status === 200) {
        await fetchEvents()
        setDeleteDialogOpen(false)
        setSelectedEventForAction(null)
        // Clear selection if deleted event was selected
        if (selectedEventId === selectedEventForAction.id.toString()) {
          setSelectedEventId("")
        }
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to delete event")
    }
    setFormLoading(false)
  }

  const handleStartGame = async () => {
    if (!selectedEventId) return

    setGameLoading(true)
    setError(null)

    try {
      const response = await apiGameStartStartGame({
        body: { event_id: Number.parseInt(selectedEventId) },
      })

      if (response.status === 201) {
        await fetchEvents()
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to start game")
    }

    setGameLoading(false)
  }

  const handleStopGame = async () => {
    if (!selectedEventId) return

    setGameLoading(true)
    setError(null)

    try {
      const response = await apiGameStopStopGame({
        body: { event_id: Number.parseInt(selectedEventId) },
      })

      if (response.status === 201) {
        await fetchEvents()
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to stop game")
    }

    setGameLoading(false)
  }

  const selectedEvent = events.find((event) => event.id.toString() === selectedEventId)

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-bold text-3xl text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your ByteBond events and games</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-destructive" />
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Event Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Event Management
            </CardTitle>
            <CardDescription>Create and manage events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Event Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[50%]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Create a new event for participants to join and play.</DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event name" {...field} disabled={formLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter unique event code" {...field} disabled={formLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCreateDialogOpen(false)
                          createForm.reset()
                        }}
                        disabled={formLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? "Creating..." : "Create Event"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Events List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Existing Events</h4>
              {eventsLoading ? (
                <div className="text-muted-foreground text-sm">Loading events...</div>
              ) : events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{event.name}</span>
                        <span className={`h-2 w-2 rounded-full ${event.is_active ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewEvent(event)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditEvent(event)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(event)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No events found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Game Control
            </CardTitle>
            <CardDescription>Control active games and matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Selection */}
            <div className="space-y-2">
              <label htmlFor="event-select" className="font-medium text-sm">
                Select Event
              </label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={eventsLoading}>
                <SelectTrigger id="event-select" className="w-full">
                  <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      <div className="flex items-center gap-2">
                        {event.name}
                        <span className={`h-2 w-2 rounded-full ${event.is_active ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                    </SelectItem>
                  ))}
                  {events.length === 0 && !eventsLoading && (
                    <SelectItem value="" disabled>
                      No events found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Event Status */}
            {selectedEvent && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Event Status</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs ${
                      selectedEvent.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedEvent.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    {selectedEvent.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Event Code: <span className="font-medium font-mono">{selectedEvent.code}</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" size="sm" onClick={handleStartGame} disabled={!selectedEventId || gameLoading || selectedEvent?.is_active}>
                {gameLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Starting...
                  </div>
                ) : (
                  "Start Game"
                )}
              </Button>
              <Button className="flex-1" variant="outline" size="sm" onClick={handleStopGame} disabled={!selectedEventId || gameLoading || !selectedEvent?.is_active}>
                {gameLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Stopping...
                  </div>
                ) : (
                  "Stop Game"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View detailed information about this event.</DialogDescription>
          </DialogHeader>
          {selectedEventForAction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{selectedEventForAction.name}</div>
              </div>
              <div className="space-y-2">
                <Label>Event Code</Label>
                <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm">{selectedEventForAction.code}</div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs ${
                      selectedEventForAction.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedEventForAction.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    {selectedEventForAction.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Whitelist Configuration</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(selectedEventForAction.whitelist, null, 2)}</pre>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Created At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedEventForAction.created_at).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Updated At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedEventForAction.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event details and whitelist configuration.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEvent)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} disabled={formLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unique event code" {...field} disabled={formLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"} disabled={formLoading}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="whitelist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Whitelist Configuration</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={8}
                        placeholder='{"emails": ["user@example.com", "admin@example.com"]}'
                        disabled={formLoading}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    editForm.reset()
                    setSelectedEventForAction(null)
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>Are you sure you want to delete this event? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {selectedEventForAction && (
            <div className="space-y-2">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="font-medium text-sm">Event: {selectedEventForAction.name}</p>
                <p className="text-muted-foreground text-sm">Code: {selectedEventForAction.code}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedEventForAction(null)
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEvent} disabled={formLoading}>
              {formLoading ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
