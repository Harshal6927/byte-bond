import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUser } from "@/components/user-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.email(),
  event_code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoading } = useUser()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      event_code: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  })

  const handleLogin = async (data: LoginFormData) => {
    await login(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="w-full border-0 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-3 px-4 pt-6 pb-4 text-center sm:px-6 sm:pt-8">
            <CardTitle className="font-bold text-2xl leading-tight sm:text-3xl">
              Welcome Back to
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent sm:ml-2">ByteBond!</span>
            </CardTitle>
            <CardDescription className="px-2 text-sm leading-relaxed sm:text-base">Sign in to your account.</CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-sm">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@example.com"
                          disabled={isLoading}
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
                  control={form.control}
                  name="event_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-sm">Event Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="DEVF2025"
                          disabled={isLoading}
                          autoComplete="off"
                          inputMode="text"
                          className="h-12 rounded-lg text-center font-mono text-base tracking-wider transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-left"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-base text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl active:scale-98 disabled:scale-100 sm:h-14 sm:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            {/* Link to signup */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                Don't have an account?{" "}
                <Link to="/onboarding" className="font-medium text-purple-600 underline-offset-2 hover:text-purple-800 hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
