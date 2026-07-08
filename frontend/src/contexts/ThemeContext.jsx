import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'

/**
 * ThemeContext
 *
 * Provides:
 *   theme          – 'dark' | 'light'
 *   setTheme(t)    – update theme, persist to localStorage, apply to <html>
 *   toggleTheme()  – convenience toggle
 *
 * On mount it reads from localStorage (defaulting to 'dark').
 * The theme is applied as data-theme="dark|light" on <html>, allowing
 * CSS custom-property overrides for the light palette.
 */
const ThemeContext = createContext(null)

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  // Apply on first render and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    const t = newTheme === 'light' ? 'light' : 'dark'
    localStorage.setItem('theme', t)
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook — throws if used outside <ThemeProvider> */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
