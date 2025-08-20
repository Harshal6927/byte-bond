import { type GetEvent, type Leaderboard, apiEventsGetEvents, apiGameLeaderboardEventIdGetLeaderboard } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createFileRoute } from "@tanstack/react-router"
import { Award, Crown, Medal, Sparkles, Target, Trophy, Users, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export const Route = createFileRoute("/_admin/leaderboard")({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const [events, setEvents] = useState<GetEvent[]>([])
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true)

      const response = await apiEventsGetEvents()
      if (response.status === 200 && response.data) {
        setEvents(response.data.items || [])
      } else {
        setError("Failed to fetch events")
      }

      setEventsLoading(false)
    }

    fetchEvents()
  }, [])

  const fetchLeaderboard = async (eventId: number, showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    const response = await apiGameLeaderboardEventIdGetLeaderboard({
      path: { event_id: eventId },
    })

    if (response.status === 200 && response.data) {
      setLeaderboard(response.data)
    } else {
      setError("Failed to fetch leaderboard data")
    }

    if (showLoading) {
      setLoading(false)
    }
  }

  // Auto-refresh effect for leaderboard
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (selectedEventId && leaderboard) {
      intervalRef.current = setInterval(() => {
        fetchLeaderboard(Number.parseInt(selectedEventId), false) // Don't show loading for auto-refresh
      }, 30000) // 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [selectedEventId, leaderboard])

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    if (eventId) {
      fetchLeaderboard(Number.parseInt(eventId))
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
      case 2:
        return <Medal className="h-8 w-8 text-gray-400 drop-shadow-lg" />
      case 3:
        return <Award className="h-8 w-8 text-amber-600 drop-shadow-lg" />
      default:
        return <span className="flex h-8 w-8 items-center justify-center font-bold text-muted-foreground text-xl">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/25"
      case 2:
        return "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-gray-950 shadow-lg shadow-gray-500/25"
      case 3:
        return "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-amber-950 shadow-lg shadow-amber-500/25"
      default:
        return "bg-gradient-to-r from-muted to-muted/80 text-muted-foreground"
    }
  }

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return "h-32"
      case 2:
        return "h-24"
      case 3:
        return "h-20"
      default:
        return "h-16"
    }
  }

  // Show only top 10 from the response
  const topTenEntries = leaderboard?.entries.slice(0, 10) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header with Theme Toggle */}
      <div className="border-b bg-gradient-to-r from-card via-card to-card/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-3xl">Leaderboard</h1>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Top performers in the networking game
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto space-y-8 px-6 py-8">
        {/* Event Selection */}
        <Card className="border-0 bg-gradient-to-r from-card to-card/95 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              Select Event
            </CardTitle>
            <CardDescription>Choose an event to view its leaderboard and rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Select value={selectedEventId} onValueChange={handleEventSelect} disabled={eventsLoading}>
                  <SelectTrigger className="h-12 w-full shadow-sm">
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
              {selectedEventId && (
                <Button
                  onClick={() => fetchLeaderboard(Number.parseInt(selectedEventId))}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="shadow-sm transition-all hover:shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading...
                    </div>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-gradient-to-r from-destructive/5 to-destructive/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  <span className="font-bold">!</span>
                </div>
                <div>
                  <span className="font-medium">Error occurred:</span>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary shadow-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="font-medium text-lg">Loading leaderboard...</p>
                <p className="mt-1 text-muted-foreground text-sm">Fetching the latest rankings</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Loading State */}
        {eventsLoading && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Content */}
        {leaderboard && !loading && (
          <div className="space-y-8">
            {/* Event Info */}
            <Card className="border-0 bg-gradient-to-r from-primary/5 via-card to-primary/5 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-2xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {leaderboard.event_name}
                  </div>

                  {/* <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <strong>{leaderboard.total_users}</strong> total participants
                  </span> */}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Top 3 Podium */}
            {topTenEntries.length >= 3 && (
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                <div className="relative p-8">
                  <div className="flex items-end justify-center gap-4 sm:gap-8">
                    {/* Second Place */}
                    <div className="flex flex-col items-center">
                      <Card className="w-full max-w-xs transform border-0 bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl transition-all duration-300 hover:scale-105 dark:from-gray-800 dark:to-gray-900">
                        <CardContent className="pt-6 text-center">
                          <div className="mb-4 flex justify-center">{getRankIcon(topTenEntries[1].rank)}</div>
                          <h3 className="mb-2 truncate font-bold text-lg">{topTenEntries[1].name}</h3>
                          <div className="space-y-3">
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm ${getRankBadgeColor(topTenEntries[1].rank)}`}>
                              <Trophy className="h-4 w-4" />
                              {topTenEntries[1].points} points
                            </div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                              <Users className="h-4 w-4" />
                              {topTenEntries[1].connection_count} connections
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <div className={`w-24 ${getPodiumHeight(2)} mt-4 flex items-center justify-center rounded-t-lg bg-gradient-to-t from-gray-400 to-gray-300 shadow-lg`}>
                        <span className="font-bold text-white text-xl">2</span>
                      </div>
                    </div>

                    {/* First Place */}
                    <div className="flex flex-col items-center">
                      <Card className="w-full max-w-xs scale-110 transform border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-2xl ring-2 ring-yellow-500/50 transition-all duration-300 hover:scale-115 dark:from-yellow-900/20 dark:to-yellow-800/20">
                        <CardContent className="pt-6 text-center">
                          <div className="mb-4 flex justify-center">{getRankIcon(topTenEntries[0].rank)}</div>
                          <h3 className="mb-2 truncate font-bold text-xl">{topTenEntries[0].name}</h3>
                          <div className="space-y-3">
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold ${getRankBadgeColor(topTenEntries[0].rank)}`}>
                              <Trophy className="h-4 w-4" />
                              {topTenEntries[0].points} points
                            </div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                              <Users className="h-4 w-4" />
                              {topTenEntries[0].connection_count} connections
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <div className={`w-24 ${getPodiumHeight(1)} mt-4 flex items-center justify-center rounded-t-lg bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-lg`}>
                        <span className="font-bold text-xl text-yellow-950">1</span>
                      </div>
                    </div>

                    {/* Third Place */}
                    <div className="flex flex-col items-center">
                      <Card className="w-full max-w-xs transform border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-xl transition-all duration-300 hover:scale-105 dark:from-amber-900/20 dark:to-amber-800/20">
                        <CardContent className="pt-6 text-center">
                          <div className="mb-4 flex justify-center">{getRankIcon(topTenEntries[2].rank)}</div>
                          <h3 className="mb-2 truncate font-bold text-lg">{topTenEntries[2].name}</h3>
                          <div className="space-y-3">
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm ${getRankBadgeColor(topTenEntries[2].rank)}`}>
                              <Trophy className="h-4 w-4" />
                              {topTenEntries[2].points} points
                            </div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                              <Users className="h-4 w-4" />
                              {topTenEntries[2].connection_count} connections
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <div className={`w-24 ${getPodiumHeight(3)} mt-4 flex items-center justify-center rounded-t-lg bg-gradient-to-t from-amber-700 to-amber-500 shadow-lg`}>
                        <span className="font-bold text-amber-950 text-xl">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Table */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead className="w-20 text-center font-bold">Rank</TableHead>
                        <TableHead className="font-bold">Player</TableHead>
                        <TableHead className="text-center font-bold">Points</TableHead>
                        <TableHead className="text-center font-bold">Connections</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topTenEntries.map((entry) => (
                        <TableRow key={entry.id} className={`transition-colors hover:bg-muted/50 ${entry.rank <= 3 ? "bg-gradient-to-r from-primary/5 to-transparent" : ""}`}>
                          <TableCell className="py-4 text-center">
                            <div className="flex items-center justify-center">{getRankIcon(entry.rank)}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <div className="font-semibold text-base">{entry.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                              <Trophy className="h-3 w-3" />
                              {entry.points}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{entry.connection_count}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Empty State for No Entries */}
            {topTenEntries.length === 0 && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="py-16 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                        <Trophy className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="mb-3 font-bold text-xl">No participants yet</h3>
                    <p className="mx-auto max-w-md text-muted-foreground">This event doesn't have any participants with points yet. Be the first to join and start networking!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Litestar branding */}
        <div className="flex items-center justify-center pb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Powered by</span>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" zoomAndPan="magnify" viewBox="0 0 375 374.999991" height="60" preserveAspectRatio="xMidYMid meet" version="1.0">
                <defs>
                  <clipPath id="52a09d205e">
                    <path d="M 15.933594 105 L 328 105 L 328 259 L 15.933594 259 Z M 15.933594 105 " clip-rule="nonzero" />
                  </clipPath>
                  <clipPath id="d31e6716a7">
                    <path d="M 142 78.769531 L 359.433594 78.769531 L 359.433594 296.269531 L 142 296.269531 Z M 142 78.769531 " clip-rule="nonzero" />
                  </clipPath>
                </defs>
                <g clip-path="url(#52a09d205e)">
                  <path
                    fill="#edb641"
                    d="M 147.625 240.3125 C 161.5 233.984375 173.554688 227.011719 183.425781 220.550781 C 202.304688 208.203125 226.4375 185.242188 227.761719 183.410156 L 218.917969 177.503906 L 211.257812 172.386719 L 235.503906 171.441406 L 243.296875 171.136719 L 245.414062 163.640625 L 252.007812 140.304688 L 260.402344 163.054688 L 263.097656 170.363281 L 270.890625 170.058594 L 295.136719 169.113281 L 276.078125 184.117188 L 269.953125 188.9375 L 272.652344 196.25 L 281.046875 218.996094 L 260.871094 205.523438 L 254.390625 201.195312 L 248.265625 206.015625 L 229.207031 221.023438 L 232.480469 209.425781 L 235.796875 197.691406 L 236.207031 196.234375 C 213.003906 213.585938 180.546875 230.304688 161.140625 236.488281 C 156.6875 237.90625 152.183594 239.179688 147.625 240.3125 Z M 101.992188 258.078125 C 136.382812 256.734375 177.355469 248 217.675781 222.363281 L 209.90625 249.867188 L 254.910156 214.4375 L 302.539062 246.246094 L 282.71875 192.539062 L 327.71875 157.109375 L 270.46875 159.34375 L 250.648438 105.636719 L 235.085938 160.726562 L 177.835938 162.964844 L 210.980469 185.097656 C 189.164062 204.921875 134.445312 247.195312 61.957031 250.03125 C 47.300781 250.601562 31.914062 249.558594 15.933594 246.394531 C 15.933594 246.394531 52.011719 260.035156 101.992188 258.078125 "
                    fill-opacity="1"
                    fill-rule="nonzero"
                  />
                </g>
                <g clip-path="url(#d31e6716a7)">
                  <path
                    fill="#edb641"
                    d="M 250.789062 78.96875 C 190.78125 78.96875 142.140625 127.570312 142.140625 187.519531 C 142.140625 198.875 143.886719 209.816406 147.121094 220.101562 C 151.847656 217.75 156.363281 215.316406 160.660156 212.84375 C 158.394531 204.789062 157.183594 196.296875 157.183594 187.519531 C 157.183594 135.871094 199.089844 93.996094 250.789062 93.996094 C 302.484375 93.996094 344.390625 135.871094 344.390625 187.519531 C 344.390625 239.171875 302.484375 281.042969 250.789062 281.042969 C 222.75 281.042969 197.597656 268.722656 180.441406 249.210938 C 175.453125 251.152344 170.402344 252.917969 165.289062 254.511719 C 185.183594 279.816406 216.082031 296.070312 250.789062 296.070312 C 310.792969 296.070312 359.433594 247.472656 359.433594 187.519531 C 359.433594 127.570312 310.792969 78.96875 250.789062 78.96875 "
                    fill-opacity="1"
                    fill-rule="nonzero"
                  />
                </g>
                <path
                  fill="#edb641"
                  d="M 92.292969 173.023438 L 98.289062 191.460938 L 117.691406 191.460938 L 101.992188 202.855469 L 107.988281 221.292969 L 92.292969 209.898438 L 76.59375 221.292969 L 82.589844 202.855469 L 66.894531 191.460938 L 86.296875 191.460938 L 92.292969 173.023438 "
                  fill-opacity="1"
                  fill-rule="nonzero"
                />
                <path
                  fill="#edb641"
                  d="M 120.214844 112.25 L 125.390625 128.167969 L 142.140625 128.167969 L 128.589844 138 L 133.765625 153.917969 L 120.214844 144.082031 L 106.664062 153.917969 L 111.839844 138 L 98.289062 128.167969 L 115.039062 128.167969 L 120.214844 112.25 "
                  fill-opacity="1"
                  fill-rule="nonzero"
                />
                <path
                  fill="#edb641"
                  d="M 34.695312 209.136719 L 37.71875 218.421875 L 47.492188 218.421875 L 39.585938 224.160156 L 42.605469 233.449219 L 34.695312 227.707031 L 26.792969 233.449219 L 29.8125 224.160156 L 21.90625 218.421875 L 31.679688 218.421875 L 34.695312 209.136719 "
                  fill-opacity="1"
                  fill-rule="nonzero"
                />
              </svg>
              <span className="font-medium text-2xl text-[#edb641]">Litestar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
