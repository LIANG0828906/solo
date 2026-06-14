import katex from 'katex'

export function renderLatex(text: string): string {
  if (!text) return ''

  let result = text

  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })
    } catch {
      return match
    }
  })

  result = result.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      })
    } catch {
      return match
    }
  })

  return result
}

export function hasLatex(text: string): boolean {
  if (!text) return false
  return /\$[\s\S]+\$/.test(text)
}

export function escapeLatex(text: string): string {
  if (!text) return ''
  return text.replace(/\\/g, '\\\\').replace(/\$/g, '\\$')
}
