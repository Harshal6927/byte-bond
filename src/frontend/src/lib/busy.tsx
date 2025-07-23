import type { GameStatus } from "@/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Clock, MessageCircle, Trophy, Users, XCircle } from "lucide-react"

interface BusyProps {
  gameStatus: GameStatus
}

export function Busy({ gameStatus }: BusyProps) {
  const totalQuestions = gameStatus.connection_questions?.length || 0
  const answeredQuestions = gameStatus.connection_questions?.filter((q) => q.question_answered).length || 0
  const correctAnswers = gameStatus.connection_questions?.filter((q) => q.answered_correctly).length || 0
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  return (
    <div className="relative space-y-6 p-4 sm:p-6">
      {/* Status Header */}
      <Card className="rounded-2xl border border-red-300 p-6 text-center shadow-sm">
        <div>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100/60">
            <MessageCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 font-bold text-red-700 text-xl">In Game</h2>
          <p className="text-red-700 text-sm">Answer questions about your partner to earn points!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 font-medium text-red-800 text-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Playing
        </div>
      </Card>

      {/* Partner Info */}
      {gameStatus.partner_name && (
        <Card className="rounded-2xl border border-purple-300 p-4 shadow-sm">
          <div className="text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <h3 className="mb-1 font-semibold text-base text-gray-300">Playing with</h3>
            <p className="font-bold text-purple-700 text-xl">{gameStatus.partner_name}</p>
          </div>
        </Card>
      )}

      {/* Progress Card */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-base text-gray-300">
            <Clock className="h-5 w-5 text-blue-600" />
            Progress
          </h3>
          <span className="text-gray-500 text-sm">
            {answeredQuestions}/{totalQuestions} answered
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 h-3 w-full rounded-full bg-gray-200 shadow-inner">
          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-green-50 p-4 shadow-sm">
            <div className="font-bold text-green-700 text-xl">{correctAnswers}</div>
            <div className="text-green-600 text-sm">Correct</div>
          </div>
          <div className="rounded-xl bg-red-50 p-4 shadow-sm">
            <div className="font-bold text-red-700 text-xl">{answeredQuestions - correctAnswers}</div>
            <div className="text-red-600 text-sm">Incorrect</div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      {gameStatus.connection_questions && gameStatus.connection_questions.length > 0 && (
        <Card className="rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-base text-gray-300">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Your Questions
          </h3>
          <div className="space-y-4">
            {gameStatus.connection_questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <p className="flex-1 text-sm leading-relaxed">
                    <span className="font-medium">Q{index + 1}:</span> {question.question_text}
                  </p>
                  <div className="ml-3 flex-shrink-0">
                    {question.question_answered ? (
                      question.answered_correctly ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 font-medium text-xs ${
                      question.question_answered ? (question.answered_correctly ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {question.question_answered ? (question.answered_correctly ? "Correct" : "Incorrect") : "Not answered"}
                  </span>

                  {!question.question_answered && (
                    <Button size="sm" className="rounded-lg bg-purple-600 text-white hover:bg-purple-700">
                      Answer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {progress === 100 && (
          <Button className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-base text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Connection
          </Button>
        )}
      </div>
    </div>
  )
}
