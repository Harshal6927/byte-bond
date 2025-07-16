import { type ReactNode, createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const isAdminPage = window.location.pathname.startsWith("/_admin") || window.location.pathname.includes("/manage") || window.location.pathname.includes("/leaderboard")

    if (isAdminPage) {
      // For admin pages, use saved theme or default to light
      const savedTheme = localStorage.getItem("admin-theme")
      return (savedTheme === "dark" ? "dark" : "light") as Theme
    }

    // For regular user pages, always use dark theme
    return "dark" as Theme
  })

  useEffect(() => {
    const root = window.document.documentElement
    const isAdminPage = window.location.pathname.startsWith("/_admin") || window.location.pathname.includes("/manage") || window.location.pathname.includes("/leaderboard")

    root.classList.remove("light", "dark")
    root.classList.add(theme)

    // Only save theme preference for admin pages
    if (isAdminPage) {
      localStorage.setItem("admin-theme", theme)
    }
  }, [theme])

  const toggleTheme = () => {
    const isAdminPage = window.location.pathname.startsWith("/_admin") || window.location.pathname.includes("/manage") || window.location.pathname.includes("/leaderboard")

    // Only allow theme toggle on admin pages
    if (isAdminPage) {
      setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
