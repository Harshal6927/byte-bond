import { type GetEvent, apiEventsGetEvents, apiGameStartStartGame, apiGameStopStopGame } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, Gamepad2, Plus, Settings, Trophy, Users } from "lucide-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

function ManagePage() {
  const [events, setEvents] = useState<GetEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [eventsLoading, setEventsLoading] = useState(true)
  const [gameLoading, setGameLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    fetchEvents()
  }, [])

  const handleStartGame = async () => {
    if (!selectedEventId) return

    setGameLoading(true)
    setError(null)

    try {
      const response = await apiGameStartStartGame({
        body: { event_id: Number.parseInt(selectedEventId) },
      })

      if (response.status === 201) {
        // Refresh events to get updated status
        const eventsResponse = await apiEventsGetEvents()
        if (eventsResponse.status === 200 && eventsResponse.data) {
          setEvents(eventsResponse.data.items || [])
        }
      } else {
        setError("Failed to start game")
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
        // Refresh events to get updated status
        const eventsResponse = await apiEventsGetEvents()
        if (eventsResponse.status === 200 && eventsResponse.data) {
          setEvents(eventsResponse.data.items || [])
        }
      } else {
        setError("Failed to stop game")
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
        <p className="text-muted-foreground">Manage your ByteBond event and participants</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">127</div>
            <p className="text-muted-foreground text-xs">+12 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">23</div>
            <p className="text-muted-foreground text-xs">8 pairs connecting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Connections Made</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">89</div>
            <p className="text-muted-foreground text-xs">+5 in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">156</div>
            <p className="text-muted-foreground text-xs">by Alex Chen</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Event Management
            </CardTitle>
            <CardDescription>Configure event settings and questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4" />
              Add New Event
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4" />
              Manage Questions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              View Event Analytics
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage participants and their data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4" />
              Add User Manually
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              Export User Data
            </Button>
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
            {/* Error Display */}
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

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

        {/* Reports & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>View detailed analytics and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              Connection Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">12:34 PM</span>
              <span>New user registered: John Doe</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">12:31 PM</span>
              <span>Game completed between Sarah and Mike</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">12:28 PM</span>
              <span>New connection formed: Alice & Bob</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">12:25 PM</span>
              <span>Question added to event: DevFest 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
