import type { GetUser } from "@/client"
import { Card } from "@/components/ui/card"
import { Clock, Sparkles, Users, Wifi } from "lucide-react"

interface AvailableProps {
  user: GetUser
}

export function Available({ user }: AvailableProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Status Header */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 text-center backdrop-blur-sm">
        <div>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg">
            <Wifi className="h-10 w-10 text-white" />
          </div>
          <h2 className="font-bold text-2xl text-emerald-400">Ready to Connect!</h2>
          <p className="text-emerald-200/80 text-sm leading-relaxed">You're available for networking. We'll pair you with someone soon!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 font-medium text-emerald-300 text-sm backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Available
        </div>
      </Card>

      {/* Waiting Animation */}
      <Card className="border-slate-700/50 bg-slate-800/50 p-6 text-center backdrop-blur-sm">
        <div>
          <div className="mb-4 flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="font-medium text-base text-slate-300">Looking for your next connection...</p>
        </div>
      </Card>

      {/* Connection Stats */}
      <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-200">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Your Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-700/10 p-4 text-center">
            <div className="font-bold text-2xl text-purple-400">{user.connection_count}</div>
            <div className="text-slate-400 text-sm">Connections</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 text-center">
            <div className="font-bold text-2xl text-blue-400">{user.points}</div>
            <div className="text-slate-400 text-sm">Points</div>
          </div>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-200">
          <Users className="h-5 w-5 text-purple-400" />
          Networking Tips
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
              <span className="font-bold text-purple-400 text-xs">1</span>
            </div>
            <div>
              <p className="font-medium text-slate-300 text-sm">Have your phone ready</p>
              <p className="text-slate-400 text-xs">QR code scanning will be needed to connect</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
              <span className="font-bold text-purple-400 text-xs">2</span>
            </div>
            <div>
              <p className="font-medium text-slate-300 text-sm">Listen to your partner carefully</p>
              <p className="text-slate-400 text-xs">You'll answer questions about your partner</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
              <span className="font-bold text-purple-400 text-xs">3</span>
            </div>
            <div>
              <p className="font-medium text-slate-300 text-sm">Earn points</p>
              <p className="text-slate-400 text-xs">Each correct answer earns you points!</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fun waiting message */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-2 text-slate-400 text-sm backdrop-blur-sm">
          <Clock className="h-4 w-4" />
          <span>Perfect time to grab a coffee ☕</span>
        </div>
      </div>
    </div>
  )
}
