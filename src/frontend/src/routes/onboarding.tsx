import { type GetQuestion, type PostUserAnswer, apiQuestionsGetQuestions, apiUsersPostUser } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/components/user-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
})

const registrationSchema = z.object({
  email: z.email(),
  name: z.string().min(1, "Name is required").max(25, "Name must be 25 characters or less"),
  event_code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
})

type RegistrationFormData = z.infer<typeof registrationSchema>

const answerSchema = z.object({
  answer: z.string().min(1, "Answer is required").max(25, "Answer must be 25 characters or less"),
})

type AnswerFormData = z.infer<typeof answerSchema>

export default function OnboardingPage() {
  const [questions, setQuestions] = useState<GetQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<PostUserAnswer[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<"questions" | "registration">("questions")

  const { login } = useUser()

  const answerForm = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answer: "",
    },
    mode: "onBlur",
  })

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      event_code: "",
    },
    mode: "onBlur",
  })

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true)
      const response = await apiQuestionsGetQuestions()

      if (response.status === 200 && response.data) {
        const signupQuestions = response.data.items

        // If there are more than 10 questions, shuffle and pick first 10
        let finalQuestions = signupQuestions || []
        if (finalQuestions.length > 10) {
          const shuffled = [...finalQuestions].sort(() => Math.random() - 0.5)
          finalQuestions = shuffled.slice(0, 10)
        }

        setQuestions(finalQuestions)

        if (finalQuestions.length === 0) {
          setStep("registration")
        }
      } else {
        toast.error("Failed to load questions")
      }

      setIsLoadingQuestions(false)
    }

    loadQuestions()
  }, [])

  const handleAnswerSubmit = (data: AnswerFormData) => {
    const currentQuestion = questions[currentQuestionIndex]

    // Save the answer
    const newAnswer: PostUserAnswer = {
      question_id: currentQuestion.id,
      answer: data.answer.trim(),
    }

    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.question_id === currentQuestion.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newAnswer
        return updated
      }
      return [...prev, newAnswer]
    })

    // Move to next question or registration
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      answerForm.reset({ answer: "" })
    } else {
      setStep("registration")
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      // Load previous answer if exists
      const previousQuestion = questions[currentQuestionIndex - 1]
      const previousAnswer = answers.find((a) => a.question_id === previousQuestion.id)
      answerForm.reset({ answer: previousAnswer?.answer || "" })
    }
  }

  const handleRegistration = async (data: RegistrationFormData) => {
    setIsSubmitting(true)

    const response = await apiUsersPostUser({
      body: {
        name: data.name.trim(),
        email: data.email.trim(),
        event_code: data.event_code.trim(),
        user_answer: answers,
      },
    })

    if (response.status === 201) {
      toast.success("Account created successfully!")

      // Automatically log in the user
      await login({
        email: data.email.trim(),
        event_code: data.event_code.trim(),
      })
    } else {
      toast.error("Failed to create account", {
        description: response.error?.detail || "Please try again",
      })
    }

    setIsSubmitting(false)
  }

  if (isLoadingQuestions) {
    return <Skeleton className="flex min-h-screen items-center justify-center">Loading...</Skeleton>
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {step === "questions" && questions.length > 0 ? (
          // Questions Step
          <Card className="border-0 bg-gradient-to-b from-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4 px-6 pt-8 pb-6 text-center">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-medium text-purple-400">{Math.round(progress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-700/50">
                <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              <CardTitle className="font-bold text-slate-100 text-xl">Let's Get to Know You!</CardTitle>
            </CardHeader>

            <CardContent className="px-6 pb-8">
              <Form {...answerForm}>
                <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-200">{currentQuestion.question}</h3>

                    <FormField
                      control={answerForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm">Your Answer</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Type your answer here..."
                              disabled={isSubmitting}
                              className="h-12 border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3">
                    {currentQuestionIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousQuestion}
                        className="h-12 flex-1 border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 flex-1 bg-gradient-to-r from-purple-500 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-purple-800"
                    >
                      {currentQuestionIndex === questions.length - 1 ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Complete
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-purple-400 transition-colors hover:text-purple-300">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Registration Step
          <Card className="border-0 bg-gradient-to-b from-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4 px-6 pt-8 pb-6 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg">
                <span className="font-bold text-2xl text-white">B</span>
              </div>
              <CardTitle className="font-bold text-2xl text-slate-100 leading-tight">Almost Done!</CardTitle>
              <CardDescription className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text font-semibold text-transparent">Create Your Account</CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8">
              <Form {...registrationForm}>
                <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-6">
                  <FormField
                    control={registrationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-slate-200 text-sm">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="John Doe"
                            disabled={isSubmitting}
                            autoComplete="name"
                            className="h-12 border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-slate-200 text-sm">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.email@example.com"
                            disabled={isSubmitting}
                            autoComplete="email"
                            inputMode="email"
                            className="h-12 border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="event_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-slate-200 text-sm">Event Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="DEVF2025"
                            disabled={isSubmitting}
                            autoComplete="off"
                            inputMode="text"
                            className="h-12 border-slate-600 bg-slate-800/50 text-center font-mono text-white tracking-wider placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:text-left"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    {questions.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setStep("questions")
                          setCurrentQuestionIndex(questions.length - 1)
                        }}
                        className="h-12 flex-1 border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 flex-1 bg-gradient-to-r from-purple-500 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-purple-800"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-purple-400 transition-colors hover:text-purple-300">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
