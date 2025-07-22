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
    <div className="space-y-4 p-4">
      {/* Status Header */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <MessageCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 font-bold text-red-800 text-xl">In Game Session</h2>
          <p className="text-red-600 text-sm">Answer questions about your partner to earn points!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 font-medium text-red-800 text-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Playing
        </div>
      </Card>

      {/* Partner Info */}
      {gameStatus.partner_name && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <div className="text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <h3 className="mb-1 font-semibold text-gray-900">Playing with</h3>
            <p className="font-bold text-lg text-purple-700">{gameStatus.partner_name}</p>
          </div>
        </Card>
      )}

      {/* Progress Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Clock className="h-5 w-5 text-blue-600" />
            Progress
          </h3>
          <span className="text-gray-500 text-sm">
            {answeredQuestions}/{totalQuestions} answered
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-3 w-full rounded-full bg-gray-200">
          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-green-50 p-3">
            <div className="font-bold text-green-700 text-lg">{correctAnswers}</div>
            <div className="text-green-600 text-xs">Correct</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="font-bold text-lg text-red-700">{answeredQuestions - correctAnswers}</div>
            <div className="text-red-600 text-xs">Incorrect</div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      {gameStatus.connection_questions && gameStatus.connection_questions.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Your Questions
          </h3>
          <div className="space-y-3">
            {gameStatus.connection_questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border bg-gray-50 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <p className="flex-1 text-gray-700 text-sm leading-relaxed">
                    <span className="font-medium text-gray-900">Q{index + 1}:</span> {question.question_text}
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
                    className={`rounded-full px-2 py-1 text-xs ${
                      question.question_answered ? (question.answered_correctly ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {question.question_answered ? (question.answered_correctly ? "Correct" : "Incorrect") : "Not answered"}
                  </span>

                  {!question.question_answered && (
                    <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
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
      <div className="space-y-3">
        {progress === 100 && (
          <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-white hover:from-green-700 hover:to-emerald-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Connection
          </Button>
        )}

        <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat with Partner
        </Button>
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">💡 Game Tip</h4>
        <p className="text-blue-700 text-sm">Use the chat feature to coordinate and learn more about each other before answering questions!</p>
      </Card>
    </div>
  )
}
