import { type GameStatus, apiGameStatusGetGameStatus } from "@/client"
import { Button } from "@/components/ui/button"
import { useUser } from "@/components/user-context"
import { Available } from "@/lib/available"
import { Busy } from "@/lib/busy"
import { Connecting } from "@/lib/connecting"
import { createFileRoute } from "@tanstack/react-router"
import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(true)
  const { user } = useUser()

  // Function to generate random interval between 10-15 seconds
  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000 // 10-15 seconds in milliseconds
  }, [])

  // Function to fetch game status
  const fetchGameStatus = useCallback(async () => {
    try {
      const response = await apiGameStatusGetGameStatus()

      if (response.status === 200 && response.data) {
        setGameStatus(response.data)
        setError(null)
      } else {
        setError("Failed to fetch game status")
        toast.error("Failed to fetch game status")
      }
    } catch (error) {
      console.error("Error fetching game status:", error)
      setError("Network error")
      toast.error("Network error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to schedule next poll
  const scheduleNextPoll = useCallback(() => {
    if (!isPollingRef.current) return

    const interval = getRandomInterval()
    timeoutRef.current = setTimeout(() => {
      fetchGameStatus().then(() => {
        scheduleNextPoll() // Schedule the next poll
      })
    }, interval)
  }, [fetchGameStatus, getRandomInterval])

  // Initial load and start polling
  useEffect(() => {
    isPollingRef.current = true

    // Initial fetch
    fetchGameStatus().then(() => {
      // Start polling after initial load
      scheduleNextPoll()
    })

    // Cleanup function
    return () => {
      isPollingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [fetchGameStatus, scheduleNextPoll])

  // Handle page visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Resume polling when page becomes visible
        if (!timeoutRef.current && isPollingRef.current) {
          fetchGameStatus().then(() => {
            scheduleNextPoll()
          })
        }
      } else {
        // Pause polling when page is hidden
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchGameStatus, scheduleNextPoll])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    fetchGameStatus()
  }, [fetchGameStatus])

  // Loading state
  if (isLoading && !gameStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="p-8 text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <h2 className="mb-2 font-semibold text-gray-900 text-lg">Loading ByteBond</h2>
          <p className="text-gray-600">Getting your game status...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !gameStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 font-semibold text-gray-900 text-lg">Connection Error</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <Button onClick={handleRefresh} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Render status-specific component
  if (gameStatus && user) {
    return (
      <div className="min-h-screen">
        {/* Main content */}
        <div className="mx-auto max-w-md">
          {gameStatus.user_status === "available" && <Available gameStatus={gameStatus} />}
          {gameStatus.user_status === "connecting" && <Connecting gameStatus={gameStatus} user={user} />}
          {gameStatus.user_status === "busy" && <Busy gameStatus={gameStatus} />}
        </div>
      </div>
    )
  }

  return null
}
