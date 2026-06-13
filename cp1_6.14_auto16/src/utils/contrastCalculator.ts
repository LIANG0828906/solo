import chroma from 'chroma-js'

export interface WcagLevel {
  normal: boolean
  large: boolean
  graphics: boolean
}

export interface ContrastResult {
  ratio: number
  wcagLevel: {
    aa: WcagLevel
    aaa: WcagLevel
  }
}

export interface RecommendedColor {
  hex: string
  ratio: number
  level: string
}

export function isValidColor(value: string): boolean {
  if (!value || value.trim() === '') return false
  try {
    chroma(value)
    return true
  } catch {
    return false
  }
}

export function calculateContrastRatio(fg: string, bg: string): ContrastResult | null {
  try {
    const fgColor = chroma(fg)
    const bgColor = chroma(bg)
    const ratio = chroma.contrast(fgColor, bgColor)

    return {
      ratio,
      wcagLevel: {
        aa: {
          normal: ratio >= 4.5,
          large: ratio >= 3,
          graphics: ratio >= 3,
        },
        aaa: {
          normal: ratio >= 7,
          large: ratio >= 4.5,
          graphics: ratio >= 4.5,
        },
      },
    }
  } catch {
    return null
  }
}

export function generateRecommendations(fg: string, bg: string, count: number = 3): RecommendedColor[] {
  try {
    const fgColor = chroma(fg)
    const bgColor = chroma(bg)
    const fgHsl = fgColor.hsl()
    const bgLuminance = bgColor.luminance()
    const recommendations: RecommendedColor[] = []

    const isLighterBetter = bgLuminance > 0.5

    const steps = isLighterBetter ? [0.15, 0.1, 0.07, 0.04, 0.02] : [0.85, 0.9, 0.93, 0.96, 0.98]

    for (const targetL of steps) {
      if (recommendations.length >= count) break

      const h = isNaN(fgHsl[0]) ? 0 : fgHsl[0]
      const s = fgHsl[1]
      const l = targetL * 100

      try {
        const candidate = chroma.hsl(h, s, l)
        const candidateHex = candidate.hex()
        const ratio = chroma.contrast(candidate, bgColor)

        if (ratio >= 4.5) {
          recommendations.push({
            hex: candidateHex,
            ratio: Math.round(ratio * 100) / 100,
            level: ratio >= 7 ? 'AAA' : 'AA',
          })
        }
      } catch {
        continue
      }
    }

    if (recommendations.length < count) {
      for (let l = 0; l <= 100; l += 5) {
        if (recommendations.length >= count) break

        const h = isNaN(fgHsl[0]) ? 0 : fgHsl[0]
        const s = fgHsl[1]

        try {
          const candidate = chroma.hsl(h, s, l)
          const candidateHex = candidate.hex()
          const ratio = chroma.contrast(candidate, bgColor)

          if (ratio >= 4.5) {
            const alreadyExists = recommendations.some((r) => r.hex === candidateHex)
            if (!alreadyExists) {
              recommendations.push({
                hex: candidateHex,
                ratio: Math.round(ratio * 100) / 100,
                level: ratio >= 7 ? 'AAA' : 'AA',
              })
            }
          }
        } catch {
          continue
        }
      }
    }

    return recommendations
  } catch {
    return []
  }
}

export function colorToHex(value: string): string {
  try {
    return chroma(value).hex()
  } catch {
    return value
  }
}
