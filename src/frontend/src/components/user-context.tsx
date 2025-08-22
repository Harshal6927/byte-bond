import { type GetUser, type PostLogin, apiAuthLoginLogin, apiAuthLogoutLogout, apiAuthMeGetUser } from "@/client"
import { useNavigate } from "@tanstack/react-router"
import { type ReactNode, createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

const HTTP_401_DETAIL = ["No JWT token found in request header or cookies", "Invalid token"]

interface UserContextType {
  user: GetUser | null
  isLoading: boolean
  login: (userData: PostLogin) => Promise<void>
  logout: () => void
  getUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<GetUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) return

    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getUser = async () => {
    const response = await apiAuthMeGetUser()

    if (response.status === 200 && response.data) {
      setUser(response.data)
    } else {
      if (window.location.pathname === "/login") return
      if (window.location.pathname === "/onboarding") return

      setUser(null)

      const errorDetail = (response.error as { detail?: string })?.detail
      if (errorDetail && HTTP_401_DETAIL.some((detail) => errorDetail.includes(detail))) {
        toast.error("Session expired, please login again")
      } else {
        toast.error("Failed to fetch user data", {
          description: errorDetail,
        })
      }

      navigate({ to: "/login" })
    }
  }

  const login = async (userData: PostLogin) => {
    setIsLoading(true)
    const response = await apiAuthLoginLogin({ body: userData })

    if (response.status === 201) {
      navigate({ to: "/", replace: true })
    } else {
      toast.error("Login failed", {
        description: response.error?.detail,
      })
    }
    setIsLoading(false)
  }

  const logout = async () => {
    navigate({ to: "/login" })
    setUser(null)
    await apiAuthLogoutLogout()
  }

  return <UserContext.Provider value={{ user, isLoading, login, logout, getUser }}>{children}</UserContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
