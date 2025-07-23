import type { GameStatus } from "@/client"
import { Card } from "@/components/ui/card"
import { Users, Wifi } from "lucide-react"

interface AvailableProps {
  gameStatus: GameStatus
}

export function Available({ gameStatus }: AvailableProps) {
  return (
    <div className="relative space-y-6 p-4 sm:p-6">
      {/* Status Header */}
      <Card className="rounded-2xl border border-green-300 p-6 text-center shadow-sm">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100/60">
            <Wifi className="h-8 w-8 text-green-300" />
          </div>
          <h2 className="mb-2 font-bold text-green-600 text-xl">Ready to Connect!</h2>
          <p className="text-green-700 text-sm">You're available for networking. We'll pair you with someone soon!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-medium text-green-800 text-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Available
        </div>
      </Card>

      {/* Waiting Animation */}
      <Card className="rounded-2xl p-6 text-center shadow-sm">
        <div>
          <div className="mb-3 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 w-3 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-gray-500 text-sm">Looking for your next connection...</p>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-base text-gray-300">
          <Users className="h-5 w-5 text-purple-600" />
          Networking Tips
        </h3>
        <ul className="space-y-3 text-gray-500 text-sm">
          <li className="flex items-start gap-3">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Have your phone ready for QR code scanning
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Be prepared to answer questions about your partner
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
            Each correct answer earns you points!
          </li>
        </ul>
      </Card>
    </div>
  )
}
