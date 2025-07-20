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
        const signupQuestions = response.data.items?.filter((q) => q.is_signup_question)
        setQuestions(signupQuestions || [])

        if (signupQuestions?.length === 0) {
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
    <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {step === "questions" && questions.length > 0 ? (
          // Questions Step
          <Card className="w-full border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-3 px-4 pt-6 pb-4 text-center sm:px-6 sm:pt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-500 text-sm">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-medium text-purple-600 text-sm">{Math.round(progress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-black">
                <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              <CardTitle className="font-bold text-gray-200 text-md leading-tight">Let's Get to Know You!</CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
              <Form {...answerForm}>
                <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="space-y-6">
                  <div className="rounded-lg">
                    <h3 className="mb-3 font-semibold text-lg">{currentQuestion.question}</h3>

                    <FormField
                      control={answerForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Your Answer</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Type your answer here..."
                              disabled={isSubmitting}
                              className="h-12 resize-none rounded-lg text-base transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
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
                        className="h-12 flex-1 rounded-lg border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
                    >
                      {currentQuestionIndex === questions.length - 1 ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Link to login */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-purple-600 underline-offset-2 hover:text-purple-800 hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Registration Step
          <Card className="w-full border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-3 px-4 pt-6 pb-4 text-center sm:px-6 sm:pt-8">
              <CardTitle className="font-bold text-2xl leading-tight sm:text-3xl">
                Almost Done!
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create Your Account</span>
              </CardTitle>
              <CardDescription className="px-2 text-sm leading-relaxed sm:text-base">Enter your details to join the networking game.</CardDescription>
            </CardHeader>

            <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
              <Form {...registrationForm}>
                <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-5">
                  <FormField
                    control={registrationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="John Doe"
                            disabled={isSubmitting}
                            autoComplete="name"
                            className="h-12 rounded-lg text-base transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.email@example.com"
                            disabled={isSubmitting}
                            autoComplete="email"
                            inputMode="email"
                            className="h-12 rounded-lg text-base transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="event_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm">Event Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="DEVF2025"
                            disabled={isSubmitting}
                            autoComplete="off"
                            inputMode="text"
                            className="h-12 rounded-lg text-center font-mono text-base tracking-wider transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-left"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
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
                        className="h-12 flex-1 rounded-lg border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-base text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-pink-700 sm:h-14 sm:text-lg"
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

              {/* Link to login */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-purple-600 underline-offset-2 hover:text-purple-800 hover:underline">
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
