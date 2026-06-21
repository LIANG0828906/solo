import type { DesignTokens } from './tokenExtractor'

export function generateCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = []

  lines.push(':root {')

  tokens.primaryColors.forEach((color, index) => {
    lines.push(`  --primary-${index + 1}: ${color.hex};`)
  })

  tokens.secondaryColors.forEach((color, index) => {
    lines.push(`  --secondary-${index + 1}: ${color.hex};`)
  })

  tokens.fonts.forEach((font, index) => {
    lines.push(`  --font-size-${index + 1}: ${font.size}px;`)
  })

  tokens.spacings.forEach((spacing) => {
    lines.push(`  --${spacing.label}: ${spacing.value}px;`)
  })

  if (tokens.primaryColors.length > 0) {
    lines.push(`  --accent-color: ${tokens.primaryColors[0].hex};`)
  }

  lines.push('}')
  lines.push('')
  lines.push('/* Usage Example: */')
  lines.push('/* .element { */')
  lines.push('/*   background-color: var(--primary-1); */')
  lines.push('/*   font-size: var(--font-size-1); */')
  lines.push('/*   padding: var(--spacing-2); */')
  lines.push('/* } */')

  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}
