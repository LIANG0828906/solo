import type { DesignTokens } from '../context/DesignTokensContext'

export function generateCssVariables(tokens: DesignTokens): Record<string, string> {
  const vars: Record<string, string> = {}

  Object.entries(tokens.colors).forEach(([key, value]) => {
    vars[`--color-${key}`] = value
  })

  Object.entries(tokens.spacing).forEach(([key, value]) => {
    vars[`--spacing-${key}`] = `${value}px`
  })

  Object.entries(tokens.fonts).forEach(([key, value]) => {
    vars[`--font-${key}`] = value
  })

  Object.entries(tokens.shadows).forEach(([key, value]) => {
    vars[`--shadow-${key}`] = `${value}px`
    vars[`--shadow-${key}-css`] = `0 ${value}px ${value * 2}px rgba(0, 0, 0, 0.15)`
  })

  return vars
}

export function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}
