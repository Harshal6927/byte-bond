import { type GameStatus, apiGameStatusGetGameStatus } from "@/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createFileRoute } from "@tanstack/react-router"
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

  // Function to generate random interval between 10-15 seconds
  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000 // 10-15 seconds in milliseconds
  }, [])

  // Function to fetch game status
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

  if (isLoading && !gameStatus) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p>Loading game status...</p>
        </div>
      </div>
    )
  }

  if (error && !gameStatus) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <Button onClick={handleRefresh} className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <Button onClick={handleRefresh} disabled={isLoading} className="rounded-md px-3 py-1 text-sm transition-colors hover:bg-gray-200 disabled:opacity-50">
          {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Refresh"}
        </Button>
      </div>

      {gameStatus && (
        <div className="space-y-4">
          {/* User Status */}
          <Card className="rounded-lg p-4 shadow">
            <h2 className="mb-2 font-semibold text-lg">Status</h2>
            <span
              className={`inline-block rounded-full px-3 py-1 font-medium text-sm ${
                gameStatus.user_status === "available"
                  ? "bg-green-100 text-green-800"
                  : gameStatus.user_status === "connecting"
                    ? "bg-yellow-100 text-yellow-800"
                    : gameStatus.user_status === "busy"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {gameStatus.user_status.charAt(0).toUpperCase() + gameStatus.user_status.slice(1)}
            </span>
          </Card>

          {/* QR Code */}
          {gameStatus.qr_code && (
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-2 font-semibold text-lg">Your QR Code</h2>
              <div className="rounded bg-gray-50 p-4 text-center">
                <p className="break-all font-mono text-sm">{gameStatus.qr_code}</p>
                <p className="mt-2 text-gray-500 text-xs">Show this to your partner</p>
              </div>
            </div>
          )}

          {/* Partner Info */}
          {gameStatus.partner_name && (
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-2 font-semibold text-lg">Connected Partner</h2>
              <p className="text-gray-700">{gameStatus.partner_name}</p>
            </div>
          )}

          {/* Connection Questions */}
          {gameStatus.connection_questions && gameStatus.connection_questions.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 font-semibold text-lg">Your Questions</h2>
              <div className="space-y-3">
                {gameStatus.connection_questions.map((question) => (
                  <div key={question.id} className="rounded border p-3">
                    <p className="mb-2 text-gray-700 text-sm">{question.question_text}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${
                          question.question_answered ? (question.answered_correctly ? "bg-green-500" : "bg-red-500") : "bg-gray-300"
                        }`}
                      />
                      <span className="text-gray-500 text-xs">{question.question_answered ? (question.answered_correctly ? "Correct" : "Incorrect") : "Not answered"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
