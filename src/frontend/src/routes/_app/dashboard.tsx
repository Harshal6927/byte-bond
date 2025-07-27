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
  const [isConnectedToWS, setIsConnectedToWS] = useState(false)
  const { user } = useUser()
  const socketRef = useRef<WebSocket | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(true)

  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000 // 10-15 seconds in milliseconds
  }, [])

  const fetchGameStatus = useCallback(async () => {
    const response = await apiGameStatusGetGameStatus()

    if (response.status === 200 && response.data) {
      setGameStatus(response.data)
      setError(null)
    } else {
      setError("Failed to fetch game status")
      toast.error("Failed to fetch game status")
    }

    setIsLoading(false)
  }, [])

  const scheduleNextPoll = useCallback(() => {
    if (!isPollingRef.current) return

    const interval = getRandomInterval()
    timeoutRef.current = setTimeout(() => {
      fetchGameStatus().then(() => {
        // Only schedule next poll if user status is still "available"
        if (gameStatus?.user_status === "available") {
          scheduleNextPoll()
        }
      })
    }, interval)
  }, [fetchGameStatus, getRandomInterval, gameStatus?.user_status])

  // WebSocket connection for game status updates
  useEffect(() => {
    if (!user) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const socket = new WebSocket(`${protocol}//${host}/ws/game-status`)

    socket.addEventListener("open", () => {
      setIsConnectedToWS(true)
    })

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data)
      if (data.message === `refresh-${user.id}`) {
        fetchGameStatus()
      }
    })

    socket.addEventListener("close", () => {
      setIsConnectedToWS(false)
    })

    socket.addEventListener("error", (error) => {
      console.error("Game status WebSocket error:", error)
      setIsConnectedToWS(false)
    })

    socketRef.current = socket

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [user, fetchGameStatus])

  // Initial fetch on component mount
  useEffect(() => {
    fetchGameStatus()
  }, [fetchGameStatus])

  // Handle game status changes - start/stop polling based on user status
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Only start polling if user status is "available"
    if (gameStatus?.user_status === "available" && isPollingRef.current) {
      scheduleNextPoll()
    }
  }, [gameStatus?.user_status, scheduleNextPoll])

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Resume polling when page becomes visible, but only if user is available
        if (!timeoutRef.current && isPollingRef.current && gameStatus?.user_status === "available") {
          fetchGameStatus().then(() => {
            if (gameStatus?.user_status === "available") {
              scheduleNextPoll()
            }
          })
        }
        // If WebSocket is disconnected when page becomes visible, fetch status
        if (!isConnectedToWS) {
          fetchGameStatus()
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
  }, [fetchGameStatus, scheduleNextPoll, isConnectedToWS, gameStatus?.user_status])

  // Cleanup polling on unmount
  useEffect(() => {
    isPollingRef.current = true

    return () => {
      isPollingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

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
          {gameStatus.user_status === "available" && <Available />}
          {gameStatus.user_status === "connecting" && <Connecting gameStatus={gameStatus} user={user} />}
          {gameStatus.user_status === "busy" && <Busy gameStatus={gameStatus} />}
        </div>
      </div>
    )
  }

  return null
}
