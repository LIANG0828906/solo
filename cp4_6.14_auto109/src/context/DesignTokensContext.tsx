import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'

export interface ColorTokens {
  primary: string
  accent: string
  background: string
  text: string
}

export interface SpacingTokens {
  xs: number
  s: number
  m: number
  l: number
  xl: number
}

export type FontFamily = 'serif' | 'sans-serif' | 'monospace'

export interface FontTokens {
  heading: FontFamily
  body: FontFamily
}

export interface ShadowTokens {
  sm: number
  md: number
  lg: number
}

export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  fonts: FontTokens
  shadows: ShadowTokens
}

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: '#3b82f6',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#1e293b',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  fonts: {
    heading: 'serif',
    body: 'sans-serif',
  },
  shadows: {
    sm: 2,
    md: 4,
    lg: 8,
  },
}

interface DesignTokensContextValue {
  tokens: DesignTokens
  updateColor: (key: keyof ColorTokens, value: string) => void
  updateSpacing: (key: keyof SpacingTokens, value: number) => void
  updateFont: (key: keyof FontTokens, value: FontFamily) => void
  updateShadow: (key: keyof ShadowTokens, value: number) => void
  resetTokens: () => void
}

const DesignTokensContext = createContext<DesignTokensContextValue | undefined>(undefined)

interface DesignTokensProviderProps {
  children: ReactNode
}

export const DesignTokensProvider: React.FC<DesignTokensProviderProps> = ({ children }) => {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)

  const updateColor = useCallback((key: keyof ColorTokens, value: string) => {
    setTokens((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }, [])

  const updateSpacing = useCallback((key: keyof SpacingTokens, value: number) => {
    setTokens((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: value },
    }))
  }, [])

  const updateFont = useCallback((key: keyof FontTokens, value: FontFamily) => {
    setTokens((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }))
  }, [])

  const updateShadow = useCallback((key: keyof ShadowTokens, value: number) => {
    setTokens((prev) => ({
      ...prev,
      shadows: { ...prev.shadows, [key]: value },
    }))
  }, [])

  const resetTokens = useCallback(() => {
    setTokens(DEFAULT_TOKENS)
  }, [])

  const value = useMemo(
    () => ({
      tokens,
      updateColor,
      updateSpacing,
      updateFont,
      updateShadow,
      resetTokens,
    }),
    [tokens, updateColor, updateSpacing, updateFont, updateShadow, resetTokens]
  )

  return (
    <DesignTokensContext.Provider value={value}>
      {children}
    </DesignTokensContext.Provider>
  )
}

export const useDesignTokens = (): DesignTokensContextValue => {
  const context = useContext(DesignTokensContext)
  if (!context) {
    throw new Error('useDesignTokens must be used within a DesignTokensProvider')
  }
  return context
}
