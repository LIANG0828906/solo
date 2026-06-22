import chroma from 'chroma-js'

export interface GeneratedPalette {
  primaryLight: string
  primary: string
  primaryDark: string
  primarySoft: string
  secondaryLight: string
  secondary: string
  secondaryDark: string
  secondarySoft: string
  accentLight: string
  accent: string
  accentDark: string
  contrast: string
}

export interface TailwindShades {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

function parseColor(hex: string): chroma.Color {
  try {
    return chroma(hex)
  } catch {
    return chroma('#888888')
  }
}

function lighten(color: chroma.Color, amount: number): string {
  return color.set('hsl.l', Math.min(1, color.get('hsl.l') + amount)).hex()
}

function darken(color: chroma.Color, amount: number): string {
  return color.set('hsl.l', Math.max(0, color.get('hsl.l') - amount)).hex()
}

function desaturate(color: chroma.Color, amount: number): string {
  return color.set('hsl.s', Math.max(0, color.get('hsl.s') - amount)).hex()
}

function complement(color: chroma.Color): chroma.Color {
  return color.set('hsl.h', (color.get('hsl.h') + 180) % 360)
}

function analogous(color: chroma.Color, degree: number): chroma.Color {
  return color.set('hsl.h', (color.get('hsl.h') + degree + 360) % 360)
}

export function generatePalette(inputColors: string[]): GeneratedPalette {
  const primary = parseColor(inputColors[0] || '#3B82F6')
  const secondary = parseColor(inputColors[1] || '#10B981')
  const accent = parseColor(inputColors[2] || '#F59E0B')

  const primaryLight = lighten(primary, 0.3)
  const primaryDark = darken(primary, 0.2)
  const primarySoft = desaturate(primary, 0.4)

  const secondaryLight = lighten(secondary, 0.3)
  const secondaryDark = darken(secondary, 0.2)
  const secondarySoft = desaturate(secondary, 0.4)

  const accentLight = lighten(accent, 0.3)
  const accentDark = darken(accent, 0.2)

  const contrastColor = complement(analogous(primary, 30))
  const contrast = desaturate(parseColor(lighten(contrastColor, 0.1)), 0.1)

  return {
    primaryLight,
    primary: primary.hex(),
    primaryDark,
    primarySoft,
    secondaryLight,
    secondary: secondary.hex(),
    secondaryDark,
    secondarySoft,
    accentLight,
    accent: accent.hex(),
    accentDark,
    contrast,
  }
}

export function generateTailwindShades(baseHex: string): TailwindShades {
  const color = parseColor(baseHex)
  const baseLightness = color.get('hsl.l')

  const steps = [0.95, 0.9, 0.8, 0.7, 0.6, baseLightness, 0.4, 0.3, 0.2, 0.1]
  const shadeKeys: (keyof TailwindShades)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

  const result = {} as TailwindShades
  steps.forEach((lightness, index) => {
    result[shadeKeys[index]] = color.set('hsl.l', Math.max(0, Math.min(1, lightness))).hex()
  })
  return result
}

export function paletteToCSSVariables(palette: GeneratedPalette): string {
  const mapping: Record<string, string> = {
    primaryLight: '--color-primary-light',
    primary: '--color-primary',
    primaryDark: '--color-primary-dark',
    primarySoft: '--color-primary-soft',
    secondaryLight: '--color-secondary-light',
    secondary: '--color-secondary',
    secondaryDark: '--color-secondary-dark',
    secondarySoft: '--color-secondary-soft',
    accentLight: '--color-accent-light',
    accent: '--color-accent',
    accentDark: '--color-accent-dark',
    contrast: '--color-contrast',
  }

  const paletteRecord = palette as unknown as Record<string, string>
  return Object.entries(mapping)
    .map(([key, varName]) => `${varName}: ${paletteRecord[key]};`)
    .join('\n')
}

export function paletteToTailwindConfig(shades: Record<string, TailwindShades>): string {
  const formatShades = (s: TailwindShades) => {
    return `{\n      50: '${s[50]}',\n      100: '${s[100]}',\n      200: '${s[200]}',\n      300: '${s[300]}',\n      400: '${s[400]}',\n      500: '${s[500]}',\n      600: '${s[600]}',\n      700: '${s[700]}',\n      800: '${s[800]}',\n      900: '${s[900]}',\n    }`
  }

  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ${formatShades(shades.primary)},
        secondary: ${formatShades(shades.secondary)},
        accent: ${formatShades(shades.accent)},
      },
    },
  },
}`
}
