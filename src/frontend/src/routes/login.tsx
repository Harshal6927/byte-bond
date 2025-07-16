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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        <Card className="border-0 bg-gradient-to-b from-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 px-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg">
              <span className="font-bold text-2xl text-white">B</span>
            </div>
            <CardTitle className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text font-bold text-3xl text-transparent leading-tight">ByteBond</CardTitle>
            <CardDescription className="text-slate-300">Sign in to start networking</CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-slate-200 text-sm">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@example.com"
                          disabled={isLoading}
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
                  control={form.control}
                  name="event_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-slate-200 text-sm">Event Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="DEVF2025"
                          disabled={isLoading}
                          autoComplete="off"
                          inputMode="text"
                          className="h-12 border-slate-600 bg-slate-800/50 text-center font-mono text-base text-white tracking-wider placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:text-left"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full bg-gradient-to-r from-purple-500 to-purple-700 font-semibold text-base text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-purple-800 hover:shadow-xl disabled:opacity-50"
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

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{" "}
                <Link to="/onboarding" className="font-medium text-purple-400 transition-colors hover:text-purple-300">
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
