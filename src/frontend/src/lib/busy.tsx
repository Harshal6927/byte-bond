import { type GameStatus, type QuestionResult, apiGameAnswerQuestionAnswerQuestion, apiGameCompleteConnectionCompleteConnection } from "@/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, MessageCircle, Timer, Trophy, Users, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BusyProps {
  gameStatus: GameStatus
}

export function Busy({ gameStatus: initialGameStatus }: BusyProps) {
  // Local state for game status that gets updated
  const [gameStatus, setGameStatus] = useState<GameStatus>(initialGameStatus)
  const totalQuestions = gameStatus.connection_questions?.length || 0
  const answeredQuestions = gameStatus.connection_questions?.filter((q) => q.question_answered).length || 0
  const correctAnswers = gameStatus.connection_questions?.filter((q) => q.answered_correctly).length || 0
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  // Answer state
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({})
  const [questionResults, setQuestionResults] = useState<Record<number, QuestionResult>>({})
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    setGameStatus(initialGameStatus)
  }, [initialGameStatus])

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownEnd) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.ceil((cooldownEnd - now) / 1000)

      if (remaining <= 0) {
        setCooldownEnd(null)
        setCooldownSeconds(0)
      } else {
        setCooldownSeconds(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownEnd])

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmitAnswer = async (questionId: number) => {
    const answer = answers[questionId]?.trim()

    if (!answer) {
      toast.error("Please enter an answer")
      return
    }

    setIsSubmitting((prev) => ({ ...prev, [questionId]: true }))

    const response = await apiGameAnswerQuestionAnswerQuestion({
      body: {
        question_id: questionId,
        answer: answer,
      },
    })

    if (response.status === 201 && response.data) {
      const result = response.data as QuestionResult

      // Store the result for this question
      setQuestionResults((prev) => ({ ...prev, [questionId]: result }))

      // Update the gameStatus to reflect the answered question
      setGameStatus((prev) => ({
        ...prev,
        connection_questions:
          prev.connection_questions?.map((q) =>
            q.question_id === questionId
              ? {
                  ...q,
                  question_answered: true,
                  answered_correctly: result.correct,
                }
              : q,
          ) || [],
      }))

      // Clear the answer input
      setAnswers((prev) => ({ ...prev, [questionId]: "" }))

      // Start 30-second cooldown
      setCooldownEnd(Date.now() + 30000)
      setCooldownSeconds(30)
    } else {
      toast.error("Failed to submit answer", {
        description: response.error?.detail || "Please try again",
      })
    }

    setIsSubmitting((prev) => ({ ...prev, [questionId]: false }))
  }

  const handleCompleteConnection = async () => {
    const response = await apiGameCompleteConnectionCompleteConnection()

    if (response.status === 201) {
      toast.success("Connection completed! You're now available for new connections.")
    } else {
      toast.error("Failed to complete connection", {
        description:
          typeof response.error === "object" && response.error !== null && "detail" in response.error ? (response.error as { detail?: string }).detail : "Please try again",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, questionId: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitAnswer(questionId)
    }
  }

  const isCooldownActive = cooldownEnd && Date.now() < cooldownEnd

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

      {/* Cooldown Timer */}
      {isCooldownActive && (
        <Card className="rounded-2xl border border-orange-300 bg-orange-50 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Timer className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-800">Cooldown: {cooldownSeconds} seconds</span>
          </div>
          <p className="text-orange-600 text-sm">Wait before answering another question</p>
        </Card>
      )}

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
        <div className="h-3 w-full rounded-full bg-gray-200 shadow-inner">
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
            {gameStatus.connection_questions.map((question, index) => {
              const result = questionResults[question.question_id]

              return (
                <div
                  key={question.question_id}
                  className={`rounded-xl border p-4 shadow-sm transition-opacity duration-300 ${
                    isCooldownActive && !question.question_answered && !result ? "opacity-50" : "opacity-100"
                  }`}
                >
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
                      ) : result ? (
                        result.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>

                  {question.question_answered || result ? (
                    // Show result for answered questions or questions with results
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1 font-medium text-xs ${
                            question.answered_correctly || result?.correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {question.answered_correctly || result?.correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      {/* Show answer details */}
                      {result && (
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-300">Your answer:</span>
                            <span className={`font-medium ${result.correct ? "text-green-700" : "text-red-700"}`}>{result.your_answer}</span>
                          </div>

                          {!result.correct && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-300">Correct answer:</span>
                              <span className="font-medium text-green-700">{result.expected_answer}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show answer input for unanswered questions
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Enter your answer..."
                        value={answers[question.question_id] || ""}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, question.question_id)}
                        disabled={isCooldownActive || isSubmitting[question.question_id]}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs">Not answered</span>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(question.question_id)}
                          disabled={!answers[question.question_id]?.trim() || isCooldownActive || isSubmitting[question.question_id]}
                          className="rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isSubmitting[question.question_id] ? "Submitting..." : "Submit Answer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Button */}
          {progress === 100 && (
            <Button
              onClick={handleCompleteConnection}
              className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-base text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
