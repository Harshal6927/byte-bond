import { type GameStatus, type QuestionResult, apiGameAnswerQuestionAnswerQuestion, apiGameCompleteConnectionCompleteConnection } from "@/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
      const updatedGameStatus = {
        ...gameStatus,
        connection_questions:
          gameStatus.connection_questions?.map((q) =>
            q.question_id === questionId
              ? {
                  ...q,
                  question_answered: true,
                  answered_correctly: result.correct,
                }
              : q,
          ) || [],
      }

      setGameStatus(updatedGameStatus)

      // Clear the answer input
      setAnswers((prev) => ({ ...prev, [questionId]: "" }))

      // Only start cooldown if there are still questions to answer
      const unansweredQuestions = updatedGameStatus.connection_questions?.filter((q) => !q.question_answered) || []
      if (unansweredQuestions.length > 0) {
        setCooldownEnd(Date.now() + 60000)
        setCooldownSeconds(60)
      }
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
    <div className="space-y-6 p-4">
      {/* Cooldown Alert */}
      {isCooldownActive && (
        <div className="-translate-x-1/2 fixed top-4 left-1/2 z-50 w-full max-w-md px-1">
          <Alert className="border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/10 shadow-xl backdrop-blur-md">
            <AlertTitle className="flex items-center justify-center gap-2 font-bold text-orange-300">
              <Timer className="h-4 w-4" />
              Cooldown Active
            </AlertTitle>
            <AlertDescription className="flex items-center justify-center text-orange-200/80">Wait {cooldownSeconds} seconds before answering another question</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Status Header */}
      <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-700/10 p-6 text-center backdrop-blur-sm">
        <div>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="font-bold text-2xl text-red-400">In Game</h2>
          <p className="text-red-200/80 text-sm leading-relaxed">Answer questions about your partner to earn points!</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 font-medium text-red-300 text-sm backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          Playing
        </div>
      </Card>

      {/* Partner Info */}
      {gameStatus.partner_name && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-700/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-sm">Playing with</p>
              <p className="font-bold text-lg text-purple-400">{gameStatus.partner_name}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Card */}
      <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-200">
            <Clock className="h-5 w-5 text-blue-400" />
            Progress
          </h3>
          <span className="text-slate-400 text-sm">
            {answeredQuestions}/{totalQuestions} answered
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-700/50 shadow-inner">
          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 text-center">
            <div className="font-bold text-2xl text-green-400">{correctAnswers}</div>
            <div className="text-green-300/80 text-sm">Correct</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-red-700/10 p-4 text-center">
            <div className="font-bold text-2xl text-red-400">{answeredQuestions - correctAnswers}</div>
            <div className="text-red-300/80 text-sm">Incorrect</div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      {gameStatus.connection_questions && gameStatus.connection_questions.length > 0 && (
        <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-200">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Your Questions
          </h3>
          <div className="space-y-4">
            {gameStatus.connection_questions.map((question, index) => {
              const result = questionResults[question.question_id]

              return (
                <div
                  key={question.question_id}
                  className={`rounded-xl border border-slate-600/50 bg-slate-700/30 p-4 transition-opacity duration-300 ${
                    isCooldownActive && !question.question_answered && !result ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <p className="flex-1 text-slate-300 text-sm leading-relaxed">
                      <span className="font-medium text-purple-400">Q{index + 1}:</span> {question.question_text}
                    </p>
                    <div className="ml-3 flex-shrink-0">
                      {question.question_answered ? (
                        question.answered_correctly ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )
                      ) : result ? (
                        result.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                      )}
                    </div>
                  </div>

                  {question.question_answered || result ? (
                    // Show result for answered questions or questions with results
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1 font-medium text-xs ${
                            question.answered_correctly || result?.correct ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {question.answered_correctly || result?.correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      {/* Show answer details */}
                      {result && (
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-400">Your answer:</span>
                            <span className={`font-medium ${result.correct ? "text-green-400" : "text-red-400"}`}>{result.your_answer}</span>
                          </div>

                          {!result.correct && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-400">Correct answer:</span>
                              <span className="font-medium text-green-400">{result.expected_answer}</span>
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
                        className="border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-slate-600/50 px-3 py-1 font-medium text-slate-300 text-xs">Not answered</span>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(question.question_id)}
                          disabled={!answers[question.question_id]?.trim() || isCooldownActive || isSubmitting[question.question_id]}
                          className="bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 disabled:opacity-50"
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-semibold text-base text-white transition-all duration-200 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="h-5 w-5" />
              Complete Connection
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
