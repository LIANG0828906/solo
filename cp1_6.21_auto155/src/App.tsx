import { useState, createContext, useContext, useCallback, useMemo } from 'react'
import ColorInput from './modules/ColorInput'
import ColorDisplay from './modules/ColorDisplay'
import type { ColorItem } from './utils/parser'
import './App.css'

export type ThemeType = 'light' | 'dark' | 'high-contrast'

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  cycleTheme: () => void
}

interface FavoritesContextType {
  favorites: ColorItem[]
  addToFavorites: (colors: ColorItem[]) => void
  removeFromFavorites: (id: string) => void
  reorderFavorites: (fromIndex: number, toIndex: number) => void
  clearFavorites: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}

const themeOrder: ThemeType[] = ['light', 'dark', 'high-contrast']

const themeIcons: Record<ThemeType, string> = {
  light: '☀️',
  dark: '🌙',
  'high-contrast': '◐'
}

const themeLabels: Record<ThemeType, string> = {
  light: '浅色主题',
  dark: '深色主题',
  'high-contrast': '高对比主题'
}

export default function App() {
  const [theme, setThemeState] = useState<ThemeType>('light')
  const [colors, setColors] = useState<ColorItem[]>([])
  const [favorites, setFavorites] = useState<ColorItem[]>([])

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentIndex = themeOrder.indexOf(prev)
      const nextIndex = (currentIndex + 1) % themeOrder.length
      const nextTheme = themeOrder[nextIndex]
      document.documentElement.setAttribute('data-theme', nextTheme)
      return nextTheme
    })
  }, [])

  const handleColorsParsed = useCallback((parsedColors: ColorItem[]) => {
    setColors(parsedColors)
  }, [])

  const addToFavorites = useCallback((colorsToAdd: ColorItem[]) => {
    setFavorites((prev) => {
      const existingIds = new Set(prev.map((c) => c.id))
      const newFavorites = colorsToAdd.filter((c) => !existingIds.has(c.id))
      return [...prev, ...newFavorites]
    })
  }, [])

  const removeFromFavorites = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites((prev) => {
      const result = [...prev]
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return result
    })
  }, [])

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  const themeContextValue = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme]
  )

  const favoritesContextValue = useMemo(
    () => ({ favorites, addToFavorites, removeFromFavorites, reorderFavorites, clearFavorites }),
    [favorites, addToFavorites, removeFromFavorites, reorderFavorites, clearFavorites]
  )

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <FavoritesContext.Provider value={favoritesContextValue}>
        <div className="app-container">
          <nav className="navbar">
            <div className="navbar-content">
              <div className="navbar-title">
                <span className="navbar-icon">🎨</span>
                <span className="navbar-text">CSS 颜色提取器</span>
              </div>
              <button
                className="theme-toggle-btn"
                onClick={cycleTheme}
                title={themeLabels[theme]}
              >
                <span className="theme-icon">{themeIcons[theme]}</span>
                <span className="theme-label">{themeLabels[theme]}</span>
              </button>
            </div>
          </nav>

          <main className="main-content">
            <div className="main-layout">
              <div className="input-section">
                <ColorInput onColorsParsed={handleColorsParsed} />
              </div>
              <div className="preview-section">
                <ColorDisplay colors={colors} />
              </div>
            </div>
          </main>
        </div>
      </FavoritesContext.Provider>
    </ThemeContext.Provider>
  )
}
