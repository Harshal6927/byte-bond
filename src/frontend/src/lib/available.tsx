import type { GameStatus } from "@/client"
import { Card } from "@/components/ui/card"
import { Clock, Trophy, Users, Wifi } from "lucide-react"

interface AvailableProps {
  gameStatus: GameStatus
}

export function Available({ gameStatus }: AvailableProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Status Header */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Wifi className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 font-bold text-green-800 text-xl">Ready to Connect!</h2>
          <p className="text-green-600 text-sm">You're available for networking. We'll pair you with someone soon!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-medium text-green-800 text-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Available
        </div>
      </Card>

      {/* Waiting Animation */}
      <Card className="p-6 text-center">
        <div className="mb-4">
          <div className="mb-3 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 w-3 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-gray-600 text-sm">Looking for your next connection...</p>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Users className="h-5 w-5 text-purple-600" />
          Networking Tips
        </h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li className="flex items-start gap-2">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Have your phone ready for QR code scanning
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Be prepared to answer questions about your partner
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Each correct answer earns you points!
          </li>
        </ul>
      </Card>

      {/* Stats Card */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Your Stats
        </h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="font-bold text-gray-900 text-lg">0</div>
            <div className="text-gray-500 text-xs">Points</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="font-bold text-gray-900 text-lg">0</div>
            <div className="text-gray-500 text-xs">Connections</div>
          </div>
        </div>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="text-center">
        <p className="flex items-center justify-center gap-1 text-gray-400 text-xs">
          <Clock className="h-3 w-3" />
          Auto-updating every 10-15 seconds
        </p>
      </div>
    </div>
  )
}
